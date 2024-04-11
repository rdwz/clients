import { Component } from "@angular/core";
import { ActivatedRoute, Params, Router } from "@angular/router";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { OrganizationApiServiceAbstraction } from "@bitwarden/common/admin-console/abstractions/organization/organization-api.service.abstraction";
import { OrganizationUserService } from "@bitwarden/common/admin-console/abstractions/organization-user/organization-user.service";
import {
  OrganizationUserAcceptInitRequest,
  OrganizationUserAcceptRequest,
} from "@bitwarden/common/admin-console/abstractions/organization-user/requests";
import { PolicyApiServiceAbstraction } from "@bitwarden/common/admin-console/abstractions/policy/policy-api.service.abstraction";
import { PolicyService } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { Policy } from "@bitwarden/common/admin-console/models/domain/policy";
import { OrganizationKeysRequest } from "@bitwarden/common/admin-console/models/request/organization-keys.request";
import { AuthService } from "@bitwarden/common/auth/abstractions/auth.service";
import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import { OrgKey } from "@bitwarden/common/types/key";

import { BaseAcceptComponent } from "../common/base.accept.component";
import { RouterService } from "../core";

@Component({
  selector: "app-accept-organization",
  templateUrl: "accept-organization.component.html",
})
export class AcceptOrganizationComponent extends BaseAcceptComponent {
  orgName: string;

  protected requiredParameters: string[] = ["organizationId", "organizationUserId", "token"];

  constructor(
    router: Router,
    platformUtilsService: PlatformUtilsService,
    i18nService: I18nService,
    route: ActivatedRoute,
    authService: AuthService,
    private routerService: RouterService,
    private cryptoService: CryptoService,
    private policyApiService: PolicyApiServiceAbstraction,
    private policyService: PolicyService,
    private logService: LogService,
    private organizationApiService: OrganizationApiServiceAbstraction,
    private organizationUserService: OrganizationUserService,
    private messagingService: MessagingService,
    private apiService: ApiService,
  ) {
    super(router, platformUtilsService, i18nService, route, authService);
  }

  async authedHandler(qParams: Params): Promise<void> {
    const initOrganization =
      qParams.initOrganization != null && qParams.initOrganization.toLocaleLowerCase() === "true";
    if (initOrganization) {
      this.actionPromise = this.acceptInitOrganizationFlow(qParams);
    } else {
      if (qParams.policyChecked !== "true") {
        // We must check the MP policy before accepting the invite
        const currentUrl = this.router.url;
        await this.addPolicyCheckedQueryParam(currentUrl);
        this.messagingService.send("logout", { redirect: false });
        return;
      }

      // User has already logged in and passed the Master Password policy check
      this.actionPromise = this.acceptFlow(qParams);
    }

    await this.actionPromise;
    await this.apiService.refreshIdentityToken();
    this.platformUtilService.showToast(
      "success",
      this.i18nService.t("inviteAccepted"),
      initOrganization
        ? this.i18nService.t("inviteInitAcceptedDesc")
        : this.i18nService.t("inviteAcceptedDesc"),
      { timeout: 10000 },
    );
    // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.router.navigate(["/vault"]);
  }

  async unauthedHandler(qParams: Params): Promise<void> {
    const persistedUrl = await this.routerService.getAndClearLoginRedirectUrl();
    await this.addPolicyCheckedQueryParam(persistedUrl);

    // In certain scenarios, we want to accelerate the user through the accept org invite process
    // For example, if the user has a BW account already, we want them to be taken to login instead of creation.
    await this.accelerateInviteAcceptIfPossible(qParams);
  }

  private async acceptInitOrganizationFlow(qParams: Params): Promise<any> {
    return this.prepareAcceptInitRequest(qParams).then((request) =>
      this.organizationUserService.postOrganizationUserAcceptInit(
        qParams.organizationId,
        qParams.organizationUserId,
        request,
      ),
    );
  }

  private async acceptFlow(qParams: Params): Promise<any> {
    return this.prepareAcceptRequest(qParams).then((request) =>
      this.organizationUserService.postOrganizationUserAccept(
        qParams.organizationId,
        qParams.organizationUserId,
        request,
      ),
    );
  }

  private async prepareAcceptInitRequest(
    qParams: Params,
  ): Promise<OrganizationUserAcceptInitRequest> {
    const request = new OrganizationUserAcceptInitRequest();
    request.token = qParams.token;

    const [encryptedOrgKey, orgKey] = await this.cryptoService.makeOrgKey<OrgKey>();
    const [orgPublicKey, encryptedOrgPrivateKey] = await this.cryptoService.makeKeyPair(orgKey);
    const collection = await this.cryptoService.encrypt(
      this.i18nService.t("defaultCollection"),
      orgKey,
    );

    request.key = encryptedOrgKey.encryptedString;
    request.keys = new OrganizationKeysRequest(
      orgPublicKey,
      encryptedOrgPrivateKey.encryptedString,
    );
    request.collectionName = collection.encryptedString;

    return request;
  }

  private async prepareAcceptRequest(qParams: Params): Promise<OrganizationUserAcceptRequest> {
    const request = new OrganizationUserAcceptRequest();
    request.token = qParams.token;

    if (await this.performResetPasswordAutoEnroll(qParams)) {
      const response = await this.organizationApiService.getKeys(qParams.organizationId);

      if (response == null) {
        throw new Error(this.i18nService.t("resetPasswordOrgKeysError"));
      }

      const publicKey = Utils.fromB64ToArray(response.publicKey);

      // RSA Encrypt user's encKey.key with organization public key
      const userKey = await this.cryptoService.getUserKey();
      const encryptedKey = await this.cryptoService.rsaEncrypt(userKey.key, publicKey);

      // Add reset password key to accept request
      request.resetPasswordKey = encryptedKey.encryptedString;
    }
    return request;
  }

  private async performResetPasswordAutoEnroll(qParams: Params): Promise<boolean> {
    let policyList: Policy[] = null;
    try {
      const policies = await this.policyApiService.getPoliciesByToken(
        qParams.organizationId,
        qParams.token,
        qParams.email,
        qParams.organizationUserId,
      );
      policyList = Policy.fromListResponse(policies);
    } catch (e) {
      this.logService.error(e);
    }

    if (policyList != null) {
      const result = this.policyService.getResetPasswordPolicyOptions(
        policyList,
        qParams.organizationId,
      );
      // Return true if policy enabled and auto-enroll enabled
      return result[1] && result[0].autoEnrollEnabled;
    }

    return false;
  }

  private async accelerateInviteAcceptIfPossible(qParams: Params): Promise<void> {
    // Extract the query params we need to make routing acceleration decisions
    const orgSsoIdentifier = qParams.orgSsoIdentifier;
    const orgUserHasExistingUser = this.stringToNullOrBool(qParams.orgUserHasExistingUser);

    // if orgUserHasExistingUser is null, short circuit for backwards compatibility w/ older servers
    if (orgUserHasExistingUser == null) {
      return;
    }

    // if user exists, send user to login
    if (orgUserHasExistingUser) {
      // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.router.navigate(["/login"], {
        queryParams: { email: qParams.email },
      });
      return;
    }

    // no user exists; so either sign in via SSO and JIT provision one or simply register.

    if (orgSsoIdentifier) {
      // We only send sso org identifier if the org has SSO enabled and the SSO policy required.
      // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.router.navigate(["/sso"], {
        queryParams: { email: qParams.email, identifier: orgSsoIdentifier },
      });
      return;
    }

    // if SSO is disabled OR if sso is enabled but the SSO login required policy is not enabled
    // then send user to create account
    // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.router.navigate(["/register"], {
      queryParams: { email: qParams.email, fromOrgInvite: true },
    });
    return;
  }

  private stringToNullOrBool(s: string | undefined): boolean | null {
    if (s === undefined) {
      return null;
    }
    return s.toLowerCase() === "true";
  }

  // Abusing the deep link redirect url here to store the policy checked state.
  // This is necessary to ensure that authenticated users that accept org invites
  // have their MP checked against policy.
  // TODO: Refactor this to avoid using login for MP check on authenticated users.
  private async addPolicyCheckedQueryParam(url: string): Promise<void> {
    const deepLinkRedirectUrl = this.router.parseUrl(url);
    deepLinkRedirectUrl.queryParams.policyChecked = "true";
    await this.routerService.persistLoginRedirectUrl(deepLinkRedirectUrl.toString());
  }
}

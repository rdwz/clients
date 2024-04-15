import { Directive, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { firstValueFrom, map } from "rxjs";

import { OrganizationApiServiceAbstraction } from "@bitwarden/common/admin-console/abstractions/organization/organization-api.service.abstraction";
import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { KeyConnectorService } from "@bitwarden/common/auth/abstractions/key-connector.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { SyncService } from "@bitwarden/common/vault/abstractions/sync/sync.service.abstraction";
import { DialogService } from "@bitwarden/components";

@Directive()
export class RemovePasswordComponent implements OnInit {
  actionPromise: Promise<void | boolean>;
  continuing = false;
  leaving = false;

  loading = true;
  organization: Organization;
  email: string;

  constructor(
    private router: Router,
    private accountService: AccountService,
    private syncService: SyncService,
    private platformUtilsService: PlatformUtilsService,
    private i18nService: I18nService,
    private keyConnectorService: KeyConnectorService,
    private organizationApiService: OrganizationApiServiceAbstraction,
    private dialogService: DialogService,
  ) {}

  async ngOnInit() {
    this.organization = await this.keyConnectorService.getManagingOrganization();
    this.email = await firstValueFrom(
      this.accountService.activeAccount$.pipe(map((a) => a?.email)),
    );
    await this.syncService.fullSync(false);
    this.loading = false;
  }

  async convert() {
    this.continuing = true;
    this.actionPromise = this.keyConnectorService.migrateUser();

    try {
      await this.actionPromise;
      this.platformUtilsService.showToast(
        "success",
        null,
        this.i18nService.t("removedMasterPassword"),
      );
      await this.keyConnectorService.removeConvertAccountRequired();
      // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.router.navigate([""]);
    } catch (e) {
      this.platformUtilsService.showToast("error", this.i18nService.t("errorOccurred"), e.message);
    }
  }

  async leave() {
    const confirmed = await this.dialogService.openSimpleDialog({
      title: this.organization.name,
      content: { key: "leaveOrganizationConfirmation" },
      type: "warning",
    });

    if (!confirmed) {
      return false;
    }

    try {
      this.leaving = true;
      this.actionPromise = this.organizationApiService.leave(this.organization.id);
      await this.actionPromise;
      this.platformUtilsService.showToast("success", null, this.i18nService.t("leftOrganization"));
      await this.keyConnectorService.removeConvertAccountRequired();
      // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.router.navigate([""]);
    } catch (e) {
      this.platformUtilsService.showToast("error", this.i18nService.t("errorOccurred"), e);
    }
  }
}

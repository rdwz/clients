import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { first } from "rxjs/operators";

import { OrganizationApiServiceAbstraction } from "@bitwarden/common/admin-console/abstractions/organization/organization-api.service.abstraction";
import { OrganizationVerifyDeleteRecoverRequest } from "@bitwarden/common/admin-console/models/request/organization-verify-delete-recover.request";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { firstValueFrom } from "rxjs";

@Component({
  selector: "app-verify-recover-delete-org",
  templateUrl: "verify-recover-delete-org.component.html",
})
export class VerifyRecoverDeleteOrgComponent implements OnInit {
  name: string;
  formPromise: Promise<any>;

  private orgId: string;
  private token: string;

  constructor(
    private router: Router,
    private apiService: OrganizationApiServiceAbstraction,
    private platformUtilsService: PlatformUtilsService,
    private i18nService: I18nService,
    private route: ActivatedRoute,
    private logService: LogService,
  ) {}

  async ngOnInit() {
    const qParams = await firstValueFrom(this.route.queryParams);
    if (qParams.orgId != null && qParams.token != null && qParams.name != null) {
      this.orgId = qParams.orgId;
      this.token = qParams.token;
      this.name = qParams.name;
    } else {
      await this.router.navigate(["/"]);
    }
  }

  async submit() {
    try {
      const request = new OrganizationVerifyDeleteRecoverRequest(this.token);
      this.formPromise = this.apiService.recoverDeleteToken(this.orgId, request);
      await this.formPromise;
      this.platformUtilsService.showToast(
        "success",
        this.i18nService.t("organizationDeleted"),
        this.i18nService.t("organizationDeletedDesc"),
      );
      await this.router.navigate(["/"]);
    } catch (e) {
      this.logService.error(e);
    }
  }
}

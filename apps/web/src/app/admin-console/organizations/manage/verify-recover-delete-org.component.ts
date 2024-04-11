import { Component, OnInit } from "@angular/core";
import { FormBuilder } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { firstValueFrom } from "rxjs";

import { OrganizationApiServiceAbstraction } from "@bitwarden/common/admin-console/abstractions/organization/organization-api.service.abstraction";
import { OrganizationVerifyDeleteRecoverRequest } from "@bitwarden/common/admin-console/models/request/organization-verify-delete-recover.request";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";

import { SharedModule } from "../../../shared/shared.module";

@Component({
  selector: "app-verify-recover-delete-org",
  templateUrl: "verify-recover-delete-org.component.html",
  standalone: true,
  imports: [SharedModule],
})
export class VerifyRecoverDeleteOrgComponent implements OnInit {
  loading = true;
  name: string;

  protected formGroup = this.formBuilder.group({});

  private orgId: string;
  private token: string;

  constructor(
    private router: Router,
    private apiService: OrganizationApiServiceAbstraction,
    private platformUtilsService: PlatformUtilsService,
    private i18nService: I18nService,
    private route: ActivatedRoute,
    private logService: LogService,
    private formBuilder: FormBuilder,
  ) {}

  async ngOnInit() {
    const qParams = await firstValueFrom(this.route.queryParams);
    if (qParams.orgId != null && qParams.token != null && qParams.name != null) {
      this.orgId = qParams.orgId;
      this.token = qParams.token;
      this.name = qParams.name;
      this.loading = false;
    } else {
      await this.router.navigate(["/"]);
    }
  }

  submit = async () => {
    try {
      const request = new OrganizationVerifyDeleteRecoverRequest(this.token);
      await this.apiService.recoverDeleteToken(this.orgId, request);
      this.platformUtilsService.showToast(
        "success",
        this.i18nService.t("organizationDeleted"),
        this.i18nService.t("organizationDeletedDesc"),
      );
      await this.router.navigate(["/"]);
    } catch (e) {
      this.logService.error(e);
    }
  };
}

import { Directive, ViewChild, ViewContainerRef, OnDestroy } from "@angular/core";
import { Observable, Subject, takeUntil } from "rxjs";

import { ModalService } from "@bitwarden/angular/services/modal.service";
import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { CipherRepromptType } from "@bitwarden/common/vault/enums/cipher-reprompt-type";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { PasswordRepromptService } from "@bitwarden/vault";

import { AddEditComponent } from "../../../vault/individual-vault/add-edit.component";
import { AddEditComponent as OrgAddEditComponent } from "../../../vault/org-vault/add-edit.component";

@Directive()
export class CipherReportComponent implements OnDestroy {
  @ViewChild("cipherAddEdit", { read: ViewContainerRef, static: true })
  cipherAddEditModalRef: ViewContainerRef;
  isAdminConsoleActive = false;

  loading = false;
  hasLoaded = false;
  ciphers: CipherView[] = [];
  organization: Organization;
  organizations$: Observable<Organization[]>;

  filterStatus: any = [0];
  showFilterToggle: boolean = false;
  filterOrgStatus = 0;
  private destroyed$: Subject<void> = new Subject();

  constructor(
    private modalService: ModalService,
    protected passwordRepromptService: PasswordRepromptService,
    protected organizationService: OrganizationService,
    protected i18nService: I18nService,
  ) {
    this.organizations$ = this.organizationService.organizations$;
  }

  getOrgName(filterId: string | number) {
    let orgName;
    if (filterId === 0) {
      orgName = this.i18nService.t("all");
    } else if (filterId === 1) {
      orgName = this.i18nService.t("me");
    } else {
      this.organizations$.pipe(takeUntil(this.destroyed$)).subscribe((orgs) => {
        orgs.filter((org: Organization) => {
          if (org.id === filterId) {
            orgName = org.name;
            return org;
          }
        });
      });
    }
    return orgName;
  }

  async filterOrgToggle(e: any) {
    await this.setCiphers();
    if (e === 0) {
      return;
    } else if (e === 1) {
      this.ciphers = this.ciphers.filter((c: any) => c.orgFilterStatus == null);
    } else {
      this.ciphers = this.ciphers.filter((c: any) => c.orgFilterStatus === e);
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  async load() {
    this.loading = true;
    await this.setCiphers();
    this.loading = false;
    this.hasLoaded = true;
  }

  async selectCipher(cipher: CipherView) {
    if (!(await this.repromptCipher(cipher))) {
      return;
    }

    const type = this.organization != null ? OrgAddEditComponent : AddEditComponent;

    const [modal, childComponent] = await this.modalService.openViewRef(
      type,
      this.cipherAddEditModalRef,
      (comp: OrgAddEditComponent | AddEditComponent) => {
        if (this.organization != null) {
          (comp as OrgAddEditComponent).organization = this.organization;
          comp.organizationId = this.organization.id;
        }

        comp.cipherId = cipher == null ? null : cipher.id;
        // eslint-disable-next-line rxjs/no-async-subscribe
        comp.onSavedCipher.subscribe(async () => {
          modal.close();
          await this.load();
        });
        // eslint-disable-next-line rxjs/no-async-subscribe
        comp.onDeletedCipher.subscribe(async () => {
          modal.close();
          await this.load();
        });
        // eslint-disable-next-line rxjs/no-async-subscribe
        comp.onRestoredCipher.subscribe(async () => {
          modal.close();
          await this.load();
        });
      },
    );

    return childComponent;
  }

  protected async setCiphers() {
    this.ciphers = [];
  }

  protected async repromptCipher(c: CipherView) {
    return (
      c.reprompt === CipherRepromptType.None ||
      (await this.passwordRepromptService.showPasswordPrompt())
    );
  }
}

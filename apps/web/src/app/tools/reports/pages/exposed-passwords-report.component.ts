import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subject, takeUntil } from "rxjs";

import { ModalService } from "@bitwarden/angular/services/modal.service";
import { AuditService } from "@bitwarden/common/abstractions/audit.service";
import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { CipherType } from "@bitwarden/common/vault/enums";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { PasswordRepromptService } from "@bitwarden/vault";

import { CipherReportComponent } from "./cipher-report.component";

@Component({
  selector: "app-exposed-passwords-report",
  templateUrl: "exposed-passwords-report.component.html",
})
export class ExposedPasswordsReportComponent
  extends CipherReportComponent
  implements OnInit, OnDestroy
{
  exposedPasswordMap = new Map<string, number>();
  disabled = true;
  orgList: string[] = [];
  filterStatus: any = [0, 1];
  showFilterToggle: boolean = false;
  filterOrgStatus = 0;
  private destroyed$: Subject<void> = new Subject();

  constructor(
    protected cipherService: CipherService,
    protected auditService: AuditService,
    protected organizationService: OrganizationService,
    modalService: ModalService,
    passwordRepromptService: PasswordRepromptService,
  ) {
    super(modalService, passwordRepromptService, organizationService);
  }

  getOrgName(filterId: string | number) {
    let orgName;
    if (filterId === 0) {
      orgName = "All";
    } else if (filterId === 1) {
      orgName = "Me";
    } else
      {this.organizations$.pipe(takeUntil(this.destroyed$)).subscribe((orgs) => {
        orgs.filter((org: Organization) => {
          if (org.id === filterId) {
            orgName = org.name;
            return org;
          }
        });
      });}
    return orgName;
  }

  async ngOnInit() {
    await super.load();
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  async setCiphers() {
    const allCiphers = await this.getAllCiphers();
    const exposedPasswordCiphers: CipherView[] = [];
    const promises: Promise<void>[] = [];

    allCiphers.forEach((ciph: any) => {
      const { type, login, isDeleted, edit, viewPassword, id } = ciph;
      if (
        type !== CipherType.Login ||
        login.password == null ||
        login.password === "" ||
        isDeleted ||
        (!this.organization && !edit) ||
        !viewPassword
      ) {
        return;
      }

      ciph.orgFilterStatus = ciph.organizationId;

      const promise = this.auditService.passwordLeaked(login.password).then((exposedCount) => {
        if (exposedCount > 0) {
          exposedPasswordCiphers.push(ciph);
          this.exposedPasswordMap.set(id, exposedCount);
          if (
            this.filterStatus.indexOf(ciph.organizationId) === -1 &&
            ciph.organizationId != null
          ) {
            this.filterStatus.push(ciph.organizationId);
            this.showFilterToggle = true;
          }
        }
      });
      promises.push(promise);
    });
    await Promise.all(promises);
    this.ciphers = [...exposedPasswordCiphers];
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

  protected getAllCiphers(): Promise<CipherView[]> {
    return this.cipherService.getAllDecrypted();
  }

  protected canManageCipher(c: CipherView): boolean {
    // this will only ever be false from the org view;
    return true;
  }
}

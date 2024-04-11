import { DIALOG_DATA, DialogConfig, DialogRef } from "@angular/cdk/dialog";
import { Component, Inject, OnInit } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";

import { OrganizationManagementPreferencesService } from "@bitwarden/common/admin-console/abstractions/organization-management-preferences/organization-management-preferences.service";
import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { DialogService } from "@bitwarden/components";

export type UserConfirmDialogData = {
  name: string;
  userId: string;
  publicKey: Uint8Array;
};

export enum UserConfirmDialogResult {
  Confirmed = "confirmed",
  Cancelled = "cancelled",
}

@Component({
  selector: "app-user-confirm",
  templateUrl: "user-confirm.component.html",
})
export class UserConfirmComponent implements OnInit {
  name: string;
  userId: string;
  publicKey: Uint8Array;
  dialogResult = UserConfirmDialogResult;

  loading = true;
  fingerprint: string;
  formPromise: Promise<any>;

  formGroup = new FormGroup({
    dontAskAgain: new FormControl(false),
  });

  constructor(
    @Inject(DIALOG_DATA) protected data: UserConfirmDialogData,
    private dialogRef: DialogRef<UserConfirmDialogResult>,
    private cryptoService: CryptoService,
    private logService: LogService,
    private organizationManagementPreferencesService: OrganizationManagementPreferencesService,
  ) {
    this.name = data.name;
    this.userId = data.userId;
    this.publicKey = data.publicKey;
  }

  async ngOnInit() {
    try {
      if (this.publicKey != null) {
        const fingerprint = await this.cryptoService.getFingerprint(this.userId, this.publicKey);
        if (fingerprint != null) {
          this.fingerprint = fingerprint.join("-");
        }
      }
    } catch (e) {
      this.logService.error(e);
    }
    this.loading = false;
  }

  submit = async () => {
    if (this.loading) {
      return;
    }

    if (this.formGroup.value.dontAskAgain) {
      await this.organizationManagementPreferencesService.autoConfirmFingerPrints.set(true);
    }

    this.dialogRef.close(UserConfirmDialogResult.Confirmed);
  };

  static open(dialogService: DialogService, config: DialogConfig<UserConfirmDialogData>) {
    return dialogService.open<UserConfirmDialogResult>(UserConfirmComponent, config);
  }
}

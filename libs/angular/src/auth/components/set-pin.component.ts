import { DialogRef } from "@angular/cdk/dialog";
import { Directive, OnInit } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";

import { PinServiceAbstraction } from "@bitwarden/auth/common";
import { UserVerificationService } from "@bitwarden/common/auth/abstractions/user-verification/user-verification.service.abstraction";
import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";

@Directive()
export class SetPinComponent implements OnInit {
  showMasterPassOnRestart = true;

  setPinForm = this.formBuilder.group({
    pin: ["", [Validators.required]],
    masterPassOnRestart: true,
  });

  constructor(
    private pinService: PinServiceAbstraction,
    private dialogRef: DialogRef,
    private cryptoService: CryptoService,
    private userVerificationService: UserVerificationService,
    private stateService: StateService,
    private formBuilder: FormBuilder,
  ) {}

  async ngOnInit() {
    const hasMasterPassword = await this.userVerificationService.hasMasterPassword();

    this.setPinForm.controls.masterPassOnRestart.setValue(hasMasterPassword);
    this.showMasterPassOnRestart = hasMasterPassword;
  }

  submit = async () => {
    const pin = this.setPinForm.get("pin").value;
    const masterPassOnRestart = this.setPinForm.get("masterPassOnRestart").value;

    if (Utils.isNullOrWhitespace(pin)) {
      this.dialogRef.close(false);
      return;
    }

    const pinKey = await this.pinService.makePinKey(
      pin,
      await this.stateService.getEmail(),
      await this.stateService.getKdfType(),
      await this.stateService.getKdfConfig(),
    );
    const userKey = await this.cryptoService.getUserKey();
    const pinKeyEncryptedUserKey = await this.cryptoService.encrypt(userKey.key, pinKey);
    const userKeyEncryptedPin = await this.cryptoService.encrypt(pin, userKey);

    await this.pinService.setProtectedPin(userKeyEncryptedPin.encryptedString);

    if (masterPassOnRestart) {
      await this.pinService.setPinKeyEncryptedUserKeyEphemeral(pinKeyEncryptedUserKey);
    } else {
      await this.pinService.setPinKeyEncryptedUserKey(pinKeyEncryptedUserKey);
    }

    this.dialogRef.close(true);
  };
}

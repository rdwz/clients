import { Location } from "@angular/common";
import { Component } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

import { GeneratorComponent as BaseGeneratorComponent } from "@bitwarden/angular/tools/generator/components/generator.component";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { PasswordGenerationServiceAbstraction } from "@bitwarden/common/tools/generator/password";
import { UsernameGenerationServiceAbstraction } from "@bitwarden/common/tools/generator/username";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { AddEditCipherInfo } from "@bitwarden/common/vault/types/add-edit-cipher-info";

@Component({
  selector: "app-generator",
  templateUrl: "generator.component.html",
})
export class GeneratorComponent extends BaseGeneratorComponent {
  private addEditCipherInfo: AddEditCipherInfo;
  private cipherState: CipherView;

  constructor(
    passwordGenerationService: PasswordGenerationServiceAbstraction,
    usernameGenerationService: UsernameGenerationServiceAbstraction,
    platformUtilsService: PlatformUtilsService,
    i18nService: I18nService,
    stateService: StateService,
    route: ActivatedRoute,
    logService: LogService,
    accountService: AccountService,
    private location: Location,
  ) {
    super(
      passwordGenerationService,
      usernameGenerationService,
      platformUtilsService,
      stateService,
      accountService,
      i18nService,
      logService,
      route,
      window,
    );
  }

  async ngOnInit() {
    this.addEditCipherInfo = await this.stateService.getAddEditCipherInfo();
    if (this.addEditCipherInfo != null) {
      this.cipherState = this.addEditCipherInfo.cipher;
    }
    this.comingFromAddEdit = this.cipherState != null;
    if (this.cipherState?.login?.hasUris) {
      this.usernameWebsite = this.cipherState.login.uris[0].hostname;
    }
    await super.ngOnInit();
  }

  select() {
    super.select();
    if (this.type === "password") {
      this.cipherState.login.password = this.password;
    } else if (this.type === "username") {
      this.cipherState.login.username = this.username;
    }
    this.addEditCipherInfo.cipher = this.cipherState;
    // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.stateService.setAddEditCipherInfo(this.addEditCipherInfo);
    this.close();
  }

  close() {
    this.location.back();
  }
}

import { Component, Input } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { map, Observable } from "rxjs";

import { User } from "@bitwarden/angular/pipes/user-name.pipe";
import { UnassignedItemsBannerService } from "@bitwarden/angular/services/unassigned-items-banner.service";
import { VaultTimeoutSettingsService } from "@bitwarden/common/abstractions/vault-timeout/vault-timeout-settings.service";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { FeatureFlag } from "@bitwarden/common/enums/feature-flag.enum";
import { VaultTimeoutAction } from "@bitwarden/common/enums/vault-timeout-action.enum";
import { ConfigService } from "@bitwarden/common/platform/abstractions/config/config.service";
import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { UserId } from "@bitwarden/common/types/guid";

@Component({
  selector: "app-header",
  templateUrl: "./web-header.component.html",
})
export class WebHeaderComponent {
  /**
   * Custom title that overrides the route data `titleId`
   */
  @Input() title: string;

  /**
   * Icon to show before the title
   */
  @Input() icon: string;

  protected routeData$: Observable<{ titleId: string }>;
  protected account$: Observable<User & { id: UserId }>;
  protected canLock$: Observable<boolean>;
  protected selfHosted: boolean;
  protected hostname = location.hostname;
  protected unassignedItemsBannerEnabled$ = this.configService.getFeatureFlag$(
    FeatureFlag.UnassignedItemsBanner,
  );

  constructor(
    private route: ActivatedRoute,
    private platformUtilsService: PlatformUtilsService,
    private vaultTimeoutSettingsService: VaultTimeoutSettingsService,
    private messagingService: MessagingService,
    protected unassignedItemsBannerService: UnassignedItemsBannerService,
    private configService: ConfigService,
    private accountService: AccountService,
  ) {
    this.routeData$ = this.route.data.pipe(
      map((params) => {
        return {
          titleId: params.titleId,
        };
      }),
    );

    this.selfHosted = this.platformUtilsService.isSelfHost();

    this.account$ = this.accountService.activeAccount$;
    this.canLock$ = this.vaultTimeoutSettingsService
      .availableVaultTimeoutActions$()
      .pipe(map((actions) => actions.includes(VaultTimeoutAction.Lock)));
  }

  protected lock() {
    this.messagingService.send("lockVault");
  }

  protected logout() {
    this.messagingService.send("logout");
  }
}

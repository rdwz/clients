// file location TBD, template files TBD

import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";

import { AvatarModule } from "../avatar";
import { ButtonModule } from "../button";
import { LinkModule } from "../link";
import { TypographyModule } from "../typography";

@Component({
  selector: "popup-layout",
  template: `
    <div
      class="tw-border tw-border-secondary-300 tw-border-solid tw-h-[640px] tw-w-[380px] tw-flex tw-flex-col"
    >
      <ng-content select="[popupHeader]"></ng-content>
      <main class="tw-bg-background-alt tw-p-3 tw-flex-1 tw-overflow-y-scroll">
        <ng-content></ng-content>
      </main>
      <ng-content select="[popupFooter]"></ng-content>
    </div>
  `,
  standalone: true,
})
export class PopupLayoutComponent {}

@Component({
  selector: "popup-header",
  template: `
    <header
      class="tw-p-4 tw-border-0 tw-border-solid tw-border-b tw-border-secondary-300 tw-flex tw-justify-between"
    >
      <div class="tw-inline-flex tw-items-center tw-gap-2 tw-h-9">
        <!-- not the right icon -->
        <i
          class="bwi bwi-angle-left tw-font-bold"
          aria-hidden="true"
          *ngIf="variant === 'sub-page'"
        ></i>
        <!-- see if this doesnt need the ! override -->
        <h1 bitTypography="h3" class="!tw-mb-0 tw-text-headers">{{ pageTitle }}</h1>
      </div>
      <div class="tw-inline-flex tw-items-center tw-gap-4 tw-h-9">
        <button bitButton *ngIf="variant === 'top-level-action'" buttonType="primary">
          <i class="bwi bwi-plus tw-font-bold" aria-hidden="true"></i>
          Add
        </button>
        <!-- TODO update icon -->
        <i class="bwi bwi-external-link" aria-hidden="true"></i>
        <bit-avatar
          *ngIf="variant === 'top-level' || variant === 'top-level-action'"
          text="Ash Ketchum"
          size="small"
        ></bit-avatar>
      </div>
    </header>
  `,
  standalone: true,
  imports: [TypographyModule, CommonModule, AvatarModule, ButtonModule],
})
export class PopupHeaderComponent {
  @Input() variant: "top-level" | "top-level-action" | "sub-page" = "top-level-action";
  @Input() pageTitle: string;
  // TODO avatar Input
  // TODO button functionality
}

@Component({
  selector: "popup-footer",
  template: `
    <footer class="tw-p-3 tw-border-0 tw-border-solid tw-border-t tw-border-secondary-300 tw-flex">
      <div class="tw-flex tw-justify-start">
        <ng-content select="[actionFooter]"></ng-content>
      </div>
    </footer>
  `,
  standalone: true,
  imports: [],
})
export class PopupFooterComponent {}

@Component({
  selector: "popup-bottom-navigation",
  template: `
    <footer class="tw-p-3 tw-border-0 tw-border-solid tw-border-t tw-border-secondary-300 tw-flex">
      <!-- top margin is offset for large font icons, look into better fix -->
      <div class="tw-flex tw-justify-around tw-flex-1 tw-mt-1">
        <a
          class="tw-flex tw-flex-col tw-items-center tw-gap-1"
          [ngClass]="activePage === 'vault' ? 'tw-font-bold tw-text-primary-600' : 'tw-text-muted'"
        >
          <i *ngIf="activePage !== 'vault'" class="bwi bwi-lg bwi-lock" aria-hidden="true"></i>
          <i *ngIf="activePage === 'vault'" class="bwi bwi-lg bwi-lock-f" aria-hidden="true"></i>
          Vault
        </a>
        <a
          class="tw-flex tw-flex-col tw-items-center tw-gap-1"
          [ngClass]="
            activePage === 'generator' ? 'tw-font-bold tw-text-primary-600' : 'tw-text-muted'
          "
        >
          <i
            *ngIf="activePage !== 'generator'"
            class="bwi bwi-lg bwi-generate"
            aria-hidden="true"
          ></i>
          <i
            *ngIf="activePage === 'generator'"
            class="bwi bwi-lg bwi-generate-f"
            aria-hidden="true"
          ></i>
          Generator
        </a>
        <a
          class="tw-flex tw-flex-col tw-items-center tw-gap-1"
          [ngClass]="activePage === 'send' ? 'tw-font-bold tw-text-primary-600' : 'tw-text-muted'"
        >
          <i *ngIf="activePage !== 'send'" class="bwi bwi-lg bwi-send" aria-hidden="true"></i>
          <i *ngIf="activePage === 'send'" class="bwi bwi-lg bwi-send-f" aria-hidden="true"></i>
          Send
        </a>
        <a
          class="tw-flex tw-flex-col tw-items-center tw-gap-1"
          [ngClass]="
            activePage === 'settings' ? 'tw-font-bold tw-text-primary-600' : 'tw-text-muted'
          "
        >
          <i *ngIf="activePage !== 'settings'" class="bwi bwi-lg bwi-cog" aria-hidden="true"></i>
          <i *ngIf="activePage === 'settings'" class="bwi bwi-lg bwi-cog-f" aria-hidden="true"></i>
          Settings
        </a>
      </div>
    </footer>
  `,
  standalone: true,
  imports: [CommonModule, LinkModule],
})
export class PopupBottomNavigationComponent {
  // TODO change implementation to router link active
  @Input() activePage: "vault" | "generator" | "send" | "settings";
  // TODO button functionality
  // TODO icon button states
}

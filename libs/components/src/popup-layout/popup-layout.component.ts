// file location TBD, template files TBD

import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";

import { AvatarModule } from "../avatar";
import { ButtonModule } from "../button";
import { LinkModule } from "../link";
import { TypographyModule } from "../typography";

// passing in header and footer separately means it's possible to combine them in ways that are not supported
// in the design (i.e. have a top level header with a sub page footer). TBD on this decision

@Component({
  selector: "popup-layout",
  template: `
    <div
      class="tw-border tw-border-secondary-300 tw-border-solid tw-h-[640px] tw-w-[380px] tw-flex tw-flex-col"
    >
      <ng-content select="[popupHeader]"></ng-content>
      <div class="tw-bg-background-alt tw-p-3 tw-flex-1 tw-overflow-scroll">
        <ng-content></ng-content>
      </div>
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
        <h1 bitTypography="h3" class="!tw-mb-0 tw-text-headers">{{ title }}</h1>
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
  @Input() title: string;
  // TODO avatar Input
  // TODO button functionality
}

@Component({
  selector: "popup-footer",
  template: `
    <footer
      class="tw-p-3 tw-border-0 tw-border-solid tw-border-t tw-border-secondary-300 tw-flex"
      *ngIf="variant !== 'sub-page'"
    >
      <!-- top margin is offset for large font icons, look into better fix -->
      <div class="tw-flex tw-justify-around tw-flex-1 tw-mt-1" *ngIf="variant === 'top-level'">
        <!-- should this be an ng-content like the action footer? do we want callers to have
        to construct these 4 buttons every time? or should they be their own sub-component then? 
        should the icon button with text also become a component? -->
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
      <div class="tw-flex tw-justify-start" *ngIf="variant === 'sub-page-action'">
        <!-- Follows dialog footer pattern -->
        <ng-content select="[actionFooter]"></ng-content>
      </div>
    </footer>
  `,
  standalone: true,
  imports: [CommonModule, LinkModule],
})
export class PopupFooterComponent {
  @Input() variant: "top-level" | "sub-page" | "sub-page-action" = "top-level";
  // can we grab it from the route instead of passing it in??
  // this input is technically required for a top-level variant but not needed for other variants,
  // which feels weird
  @Input() activePage: "vault" | "generator" | "send" | "settings";
  // TODO button functionality
  // TODO icon button states
}

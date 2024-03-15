import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { RouterModule } from "@angular/router";

import { LinkModule } from "../link";
import { SharedModule } from "../shared";

import { SideNavComponent } from "./side-nav.component";
import { SideNavService } from "./side-nav.service";

export type LayoutVariant = "primary" | "secondary";

@Component({
  selector: "bit-layout",
  templateUrl: "layout.component.html",
  standalone: true,
  imports: [CommonModule, SharedModule, LinkModule, RouterModule, SideNavComponent],
})
export class LayoutComponent {
  protected mainContentId = "main-content";

  @Input() variant: LayoutVariant = "primary";

  constructor(protected sideNavService: SideNavService) {}

  protected handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      this.sideNavService.setClose();
      document.getElementById("bit-side-nav-toggle-button").focus();
      return false;
    }

    return true;
  };
  focusMainContent() {
    document.getElementById(this.mainContentId)?.focus();
  }
}

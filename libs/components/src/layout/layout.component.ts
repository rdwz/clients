import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { RouterModule } from "@angular/router";

import { LinkModule } from "../link";
import { SideNavService } from "../navigation/side-nav.service";
import { SharedModule } from "../shared";

@Component({
  selector: "bit-layout",
  templateUrl: "layout.component.html",
  standalone: true,
  imports: [CommonModule, SharedModule, LinkModule, RouterModule],
})
export class LayoutComponent {
  protected mainContentId = "main-content";

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

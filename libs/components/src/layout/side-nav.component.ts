import { A11yModule } from "@angular/cdk/a11y";
import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { RouterModule } from "@angular/router";

import { IconButtonModule } from "../icon-button";
import { LinkModule } from "../link";
import { NavigationModule } from "../navigation";
import { SharedModule } from "../shared";

import { SideNavService } from "./side-nav.service";

export type LayoutVariant = "primary" | "secondary";

@Component({
  selector: "bit-side-nav",
  templateUrl: "side-nav.component.html",
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    NavigationModule,
    A11yModule,
    IconButtonModule,
    LinkModule,
    RouterModule,
  ],
})
export class SideNavComponent {
  constructor(protected sideNavService: SideNavService) {}

  protected handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      this.sideNavService.setClose();
      document.getElementById("bit-side-nav-toggle-button").focus();
      return false;
    }

    return true;
  };
}

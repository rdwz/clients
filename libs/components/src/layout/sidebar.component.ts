import { A11yModule } from "@angular/cdk/a11y";
import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { RouterModule } from "@angular/router";

import { IconButtonModule } from "../icon-button";
import { LinkModule } from "../link";
import { NavigationModule } from "../navigation";
import { SharedModule } from "../shared";

import { SidebarService } from "./sidebar.service";

export type LayoutVariant = "primary" | "secondary";

@Component({
  selector: "bit-sidebar",
  templateUrl: "sidebar.component.html",
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
export class SidebarComponent {
  constructor(protected sidebarService: SidebarService) {}

  protected handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      this.sidebarService.setClose();
      document.getElementById("bit-sidebar-toggle-button").focus();
      return false;
    }

    return true;
  };
}

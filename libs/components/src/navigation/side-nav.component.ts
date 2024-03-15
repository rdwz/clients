import { Component, Input } from "@angular/core";

import { SideNavService } from "./side-nav.service";

@Component({
  selector: "bit-side-nav",
  templateUrl: "side-nav.component.html",
})
export class SideNavComponent {
  @Input() variant: "primary" | "secondary" = "primary";

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

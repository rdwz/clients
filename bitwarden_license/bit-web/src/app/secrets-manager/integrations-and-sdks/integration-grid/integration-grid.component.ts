import { Component, Input } from "@angular/core";

import { Integration } from "../models/integration";

@Component({
  selector: "sm-integration-grid",
  templateUrl: "./integration-grid.component.html",
})
export class IntegrationGridComponent {
  @Input() integrations: Integration[];
}

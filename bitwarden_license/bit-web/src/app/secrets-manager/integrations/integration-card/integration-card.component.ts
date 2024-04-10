import { Component, Input } from "@angular/core";

@Component({
  selector: "sm-integration-card",
  templateUrl: "./integration-card.component.html",
})
export class IntegrationCardComponent {
  @Input() name: string;
  @Input() image: string;
  @Input() secondaryText: string;
  @Input() linkURL: string;
}

import { Component, Input } from "@angular/core";

@Component({
  selector: "sm-integration-card",
  templateUrl: "./integration-card.component.html",
})
export class IntegrationCardComponent {
  @Input() name: string;
  @Input() image: string;
  @Input() linkText: string;
  @Input() linkURL: string;

  /** Adds relevant `rel` attribute to external links */
  @Input() externalURL?: boolean;

  /**
   * Date of when the new badge should be hidden.
   * When omitted, the new badge is never shown.
   *
   * @example "2024-12-31"
   */
  @Input() newBadgeExpiration?: string;

  /** Show the "new" badge when expiration is in the future */
  showNewBadge() {
    if (!this.newBadgeExpiration) {
      return false;
    }

    const expirationDate = new Date(this.newBadgeExpiration);

    // Do not show the new badge for invalid dates
    if (isNaN(expirationDate.getTime())) {
      return false;
    }

    return expirationDate > new Date();
  }
}

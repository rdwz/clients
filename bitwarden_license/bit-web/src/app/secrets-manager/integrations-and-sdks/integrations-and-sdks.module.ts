import { NgModule } from "@angular/core";

import { SecretsManagerSharedModule } from "../shared/sm-shared.module";

import { IntegrationCardComponent } from "./integration-card/integration-card.component";
import { IntegrationGridComponent } from "./integration-grid/integration-grid.component";
import { IntegrationsRoutingModule } from "./integrations-and-sdks-routing.module";
import { IntegrationsAndSDKsComponent } from "./integrations-and-sdks.component";

@NgModule({
  imports: [SecretsManagerSharedModule, IntegrationsRoutingModule],
  declarations: [IntegrationsAndSDKsComponent, IntegrationGridComponent, IntegrationCardComponent],
  providers: [],
})
export class IntegrationsAndSDKsModule {}

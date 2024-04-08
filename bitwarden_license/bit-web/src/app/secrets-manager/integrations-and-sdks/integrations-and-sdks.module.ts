import { NgModule } from "@angular/core";

import { SecretsManagerSharedModule } from "../shared/sm-shared.module";

import { IntegrationsComponent } from "./integrations/integrations.component";
import { IntegrationsRoutingModule } from "./integrations-and-sdks-routing.module";
import { IntegrationsAndSDKsComponent } from "./integrations-and-sdks.component";
import { SdksComponent } from "./sdks/sdks.component";

@NgModule({
  imports: [SecretsManagerSharedModule, IntegrationsRoutingModule],
  declarations: [IntegrationsAndSDKsComponent, IntegrationsComponent, SdksComponent],
  providers: [],
})
export class IntegrationsAndSDKsModule {}

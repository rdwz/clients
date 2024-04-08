import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { IntegrationsAndSDKsComponent } from "./integrations-and-sdks.component";

const routes: Routes = [
  {
    path: "",
    component: IntegrationsAndSDKsComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class IntegrationsRoutingModule {}

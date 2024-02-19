import { CommonModule } from "@angular/common";
import { ModuleWithProviders, NgModule } from "@angular/core";
import { GlobalConfig, TOAST_CONFIG } from "ngx-toastr";

import { ToastComponent } from "./toast.component";
import { BitwardenToastrComponent, BitwardenToastrGlobalConfig } from "./toastr.component";

@NgModule({
  imports: [CommonModule, ToastComponent],
  declarations: [BitwardenToastrComponent],
  exports: [BitwardenToastrComponent],
})
export class ToastModule {
  static forRoot(config: Partial<GlobalConfig> = {}): ModuleWithProviders<ToastModule> {
    return {
      ngModule: ToastModule,
      providers: [
        {
          provide: TOAST_CONFIG,
          useValue: {
            default: BitwardenToastrGlobalConfig,
            config: config,
          },
        },
      ],
    };
  }
}

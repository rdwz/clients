import { Injectable } from "@angular/core";
import { IndividualConfig, ToastrService } from "ngx-toastr";

import type { ToastVariant } from "./toast.component";

export type ToastOptions = {
  message: string | string[];
  variant: ToastVariant;
  title?: string;
  timeout?: number;
};

/**
 * Presents toast notifications.
 *
 * Facade for `ngx-toastr`
 **/
@Injectable({ providedIn: "root" })
export class ToastService {
  constructor(private toastrService: ToastrService) {}

  showToast(options: ToastOptions) {
    const toastrConfig: Partial<IndividualConfig> = {
      timeOut: options.timeout,
      payload: {
        message: options.message,
        variant: options.variant,
      },
    };

    this.toastrService.show(null, options.title, toastrConfig, "toast-" + options.variant);
  }

  /** @deprecated use `showToast` instead */
  _showToast(options: {
    type: "error" | "success" | "warning" | "info";
    title: string;
    text: string | string[];
    options?: {
      timeout?: number;
    };
  }) {
    this.showToast({
      message: options.text,
      variant: options.type,
      title: options.title,
      timeout: options.options?.timeout,
    });
  }
}

import { Injectable, SecurityContext } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
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
  constructor(
    private toastrService: ToastrService,
    private sanitizer: DomSanitizer,
  ) {}

  showToast(options: ToastOptions) {
    let message = "";

    const toastrConfig: Partial<IndividualConfig> = {};

    if (typeof options.message === "string") {
      message = options.message;
    } else if (options.message.length === 1) {
      message = options.message[0];
    } else {
      options.message.forEach(
        (t: string) =>
          (message += "<p>" + this.sanitizer.sanitize(SecurityContext.HTML, t) + "</p>"),
      );
      toastrConfig.enableHtml = true;
    }

    if (options.timeout) {
      toastrConfig.timeOut = options.timeout;
    }

    toastrConfig.payload = {
      type: options.variant,
    };

    this.toastrService.show(message, options.title, toastrConfig, "toast-" + options.variant);
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

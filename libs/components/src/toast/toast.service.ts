import { Injectable, SecurityContext } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { IndividualConfig, ToastrService } from "ngx-toastr";

import { ToastVariant } from "./toast.component";

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

  showToast(config: {
    text: string | string[];
    type: ToastVariant;
    title: string;
    /** FIXME: remove `any` type */
    options?: any;
  }) {
    let message = "";

    const options: Partial<IndividualConfig> = {};

    if (typeof config.text === "string") {
      message = config.text;
    } else if (config.text.length === 1) {
      message = config.text[0];
    } else {
      config.text.forEach(
        (t: string) =>
          (message += "<p>" + this.sanitizer.sanitize(SecurityContext.HTML, t) + "</p>"),
      );
      options.enableHtml = true;
    }
    if (config.options != null) {
      if (config.options.trustedHtml === true) {
        options.enableHtml = true;
      }
      if (config.options.timeout != null && config.options.timeout > 0) {
        options.timeOut = config.options.timeout;
      }
    }

    options.payload = {
      type: config.type,
    };

    this.toastrService.show(message, config.title, options, "toast-" + config.type);
  }
}

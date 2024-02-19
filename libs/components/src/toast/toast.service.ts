import { Injectable, SecurityContext } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { IndividualConfig, ToastrService } from "ngx-toastr";

import { BitToastType } from "./toast.component";

/**
 * Presents toast notifications.
 * Acts as facade over `ngx-toastr`.
 **/
@Injectable({ providedIn: "root" })
export class ToastService {
  constructor(
    private toastrService: ToastrService,
    private sanitizer: DomSanitizer,
  ) {}

  showToast(msg: {
    text: string | string[];
    type: BitToastType;

    /** @deprecated */
    title: string;
    /** @deprecated */
    options?: any;
  }) {
    let message = "";

    const options: Partial<IndividualConfig> = {};

    if (typeof msg.text === "string") {
      message = msg.text;
    } else if (msg.text.length === 1) {
      message = msg.text[0];
    } else {
      msg.text.forEach(
        (t: string) =>
          (message += "<p>" + this.sanitizer.sanitize(SecurityContext.HTML, t) + "</p>"),
      );
      options.enableHtml = true;
    }
    if (msg.options != null) {
      if (msg.options.trustedHtml === true) {
        options.enableHtml = true;
      }
      if (msg.options.timeout != null && msg.options.timeout > 0) {
        options.timeOut = msg.options.timeout;
      }
    }

    options.payload = {
      type: msg.type,
    };

    this.toastrService.show(message, msg.title, options, "toast-" + msg.type);
  }
}

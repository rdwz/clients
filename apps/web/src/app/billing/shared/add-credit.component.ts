import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from "@angular/core";
import { firstValueFrom, map } from "rxjs";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { PaymentMethodType } from "@bitwarden/common/billing/enums";
import { BitPayInvoiceRequest } from "@bitwarden/common/billing/models/request/bit-pay-invoice.request";
import { ConfigService } from "@bitwarden/common/platform/abstractions/config/config.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";

export type PayPalConfig = {
  businessId?: string;
  buttonAction?: string;
};

@Component({
  selector: "app-add-credit",
  templateUrl: "add-credit.component.html",
})
export class AddCreditComponent implements OnInit {
  @Input() creditAmount: string;
  @Input() showOptions = true;
  @Input() method = PaymentMethodType.PayPal;
  @Input() organizationId: string;
  @Output() onAdded = new EventEmitter();
  @Output() onCanceled = new EventEmitter();

  @ViewChild("ppButtonForm", { read: ElementRef, static: true }) ppButtonFormRef: ElementRef;

  paymentMethodType = PaymentMethodType;
  ppButtonFormAction: string;
  ppButtonBusinessId: string;
  ppButtonCustomField: string;
  ppLoading = false;
  subject: string;
  returnUrl: string;
  formPromise: Promise<any>;

  private userId: string;
  private name: string;
  private email: string;
  private region: string;

  constructor(
    private stateService: StateService,
    private apiService: ApiService,
    private platformUtilsService: PlatformUtilsService,
    private organizationService: OrganizationService,
    private logService: LogService,
    private configService: ConfigService,
    private accountService: AccountService,
  ) {
    const payPalConfig = process.env.PAYPAL_CONFIG as PayPalConfig;
    this.ppButtonFormAction = payPalConfig.buttonAction;
    this.ppButtonBusinessId = payPalConfig.businessId;
  }

  async ngOnInit() {
    if (this.organizationId != null) {
      if (this.creditAmount == null) {
        this.creditAmount = "20.00";
      }
      this.ppButtonCustomField = "organization_id:" + this.organizationId;
      const org = await this.organizationService.get(this.organizationId);
      if (org != null) {
        this.subject = org.name;
        this.name = org.name;
      }
    } else {
      if (this.creditAmount == null) {
        this.creditAmount = "10.00";
      }
      [this.userId, this.subject] = await firstValueFrom(
        this.accountService.activeAccount$.pipe(map((a) => [a?.id, a?.email])),
      );
      this.email = this.subject;
      this.ppButtonCustomField = "user_id:" + this.userId;
    }
    this.region = await firstValueFrom(this.configService.cloudRegion$);
    this.ppButtonCustomField += ",account_credit:1";
    this.ppButtonCustomField += `,region:${this.region}`;
    this.returnUrl = window.location.href;
  }

  async submit() {
    if (this.creditAmount == null || this.creditAmount === "") {
      return;
    }

    if (this.method === PaymentMethodType.PayPal) {
      this.ppButtonFormRef.nativeElement.submit();
      this.ppLoading = true;
      return;
    }
    if (this.method === PaymentMethodType.BitPay) {
      try {
        const req = new BitPayInvoiceRequest();
        req.email = this.email;
        req.name = this.name;
        req.credit = true;
        req.amount = this.creditAmountNumber;
        req.organizationId = this.organizationId;
        req.userId = this.userId;
        req.returnUrl = this.returnUrl;
        this.formPromise = this.apiService.postBitPayInvoice(req);
        const bitPayUrl: string = await this.formPromise;
        this.platformUtilsService.launchUri(bitPayUrl);
      } catch (e) {
        this.logService.error(e);
      }
      return;
    }
    try {
      this.onAdded.emit();
    } catch (e) {
      this.logService.error(e);
    }
  }

  cancel() {
    this.onCanceled.emit();
  }

  formatAmount() {
    try {
      if (this.creditAmount != null && this.creditAmount !== "") {
        const floatAmount = Math.abs(parseFloat(this.creditAmount));
        if (floatAmount > 0) {
          this.creditAmount = parseFloat((Math.round(floatAmount * 100) / 100).toString())
            .toFixed(2)
            .toString();
          return;
        }
      }
    } catch (e) {
      this.logService.error(e);
    }
    this.creditAmount = "";
  }

  get creditAmountNumber(): number {
    if (this.creditAmount != null && this.creditAmount !== "") {
      try {
        return parseFloat(this.creditAmount);
      } catch (e) {
        this.logService.error(e);
      }
    }
    return null;
  }
}

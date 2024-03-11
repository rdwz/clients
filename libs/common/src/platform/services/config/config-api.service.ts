import { firstValueFrom } from "rxjs";

import { ApiService } from "../../../abstractions/api.service";
import { AccountService } from "../../../auth/abstractions/account.service";
import { AuthenticationStatus } from "../../../auth/enums/authentication-status";
import { ConfigApiServiceAbstraction } from "../../abstractions/config/config-api.service.abstraction";
import { ServerConfigResponse } from "../../models/response/server-config.response";

export class ConfigApiService implements ConfigApiServiceAbstraction {
  constructor(
    private apiService: ApiService,
    private accountService: AccountService,
  ) {}

  async get(): Promise<ServerConfigResponse> {
    const activeAccount = await firstValueFrom(this.accountService.activeAccount$);
    const authed = activeAccount != null && activeAccount.status !== AuthenticationStatus.LoggedOut;

    const r = await this.apiService.send("GET", "/config", null, authed, true);
    return new ServerConfigResponse(r);
  }
}

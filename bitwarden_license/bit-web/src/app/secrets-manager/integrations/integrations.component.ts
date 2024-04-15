import { Component } from "@angular/core";

import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";

import { Integration } from "./models/integration";

@Component({
  selector: "sm-integrations",
  templateUrl: "./integrations.component.html",
})
export class IntegrationsComponent {
  private integrationsAndSdks: Integration[] = [];

  constructor(i18nService: I18nService) {
    this.integrationsAndSdks = [
      {
        name: "GitHub Actions",
        linkText: i18nService.t("setUpGithubActions"),
        linkURL: "https://bitwarden.com/help/github-actions-integration/",
        image: "../../../../../../../images/secrets-manager/integrations/github.svg",
        type: "integration",
      },
      {
        name: "GitLab CI/CD",
        linkText: i18nService.t("setUpGitlabCICD"),
        linkURL: "https://bitwarden.com/help/gitlab-integration/",
        image: "../../../../../../../images/secrets-manager/integrations/gitlab.svg",
        type: "integration",
      },
      {
        name: "Ansible",
        linkText: i18nService.t("setUpAnsible"),
        linkURL: "https://bitwarden.com/help/ansible-integration/",
        image: "../../../../../../../images/secrets-manager/integrations/ansible.svg",
        type: "integration",
      },
      {
        name: "C#",
        linkText: i18nService.t("cSharpSDKRepo"),
        linkURL: "https://github.com/bitwarden/sdk/tree/main/languages/csharp",
        image: "../../../../../../../images/secrets-manager/sdks/c-sharp.svg",
        type: "sdk",
      },
      {
        name: "C++",
        linkText: i18nService.t("cPlusPlusSDKRepo"),
        linkURL: "https://github.com/bitwarden/sdk/tree/main/languages/cpp",
        image: "../../../../../../../images/secrets-manager/sdks/c-plus-plus.png",
        type: "sdk",
      },
      {
        name: "Go",
        linkText: i18nService.t("goSDKRepo"),
        linkURL: "https://github.com/bitwarden/sdk/tree/main/languages/go",
        image: "../../../../../../../images/secrets-manager/sdks/go.svg",
        type: "sdk",
      },
      {
        name: "Java",
        linkText: i18nService.t("javaSDKRepo"),
        linkURL: "https://github.com/bitwarden/sdk/tree/main/languages/java",
        image: "../../../../../../../images/secrets-manager/sdks/java.png",
        type: "sdk",
      },
      {
        name: "JS WebAssembly",
        linkText: i18nService.t("jsWebAssemblySDKRepo"),
        linkURL: "https://github.com/bitwarden/sdk/tree/main/languages/js",
        image: "../../../../../../../images/secrets-manager/sdks/wasm.svg",
        type: "sdk",
      },
      {
        name: "php",
        linkText: i18nService.t("phpSDKRepo"),
        linkURL: "https://github.com/bitwarden/sdk/tree/main/languages/php",
        image: "../../../../../../../images/secrets-manager/sdks/php.svg",
        type: "sdk",
      },
      {
        name: "Python",
        linkText: i18nService.t("pythonSDKRepo"),
        linkURL: "https://github.com/bitwarden/sdk/tree/main/languages/python",
        image: "../../../../../../../images/secrets-manager/sdks/python.svg",
        type: "sdk",
      },
      {
        name: "Ruby",
        linkText: i18nService.t("rubySDKRepo"),
        linkURL: "https://github.com/bitwarden/sdk/tree/main/languages/ruby",
        image: "../../../../../../../images/secrets-manager/sdks/ruby.png",
        type: "sdk",
      },
    ];
  }

  /** Filter out content for the integrations sections */
  get integrations(): Integration[] {
    return this.integrationsAndSdks.filter((integration) => integration.type === "integration");
  }

  /** Filter out content for the SDKs section */
  get sdks(): Integration[] {
    return this.integrationsAndSdks.filter((integration) => integration.type === "sdk");
  }
}

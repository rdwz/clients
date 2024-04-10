import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { mock } from "jest-mock-extended";

import { I18nService } from "../../../../../../libs/common/src/platform/abstractions/i18n.service.ts";
import { I18nPipe } from "../../../../../../libs/components/src/shared/i18n.pipe.ts";

import { IntegrationCardComponent } from "./integration-card/integration-card.component";
import { IntegrationGridComponent } from "./integration-grid/integration-grid.component";
import { IntegrationsAndSDKsComponent } from "./integrations-and-sdks.component";

@Component({
  selector: "app-header",
  template: "<div></div>",
})
class MockHeaderComponent {}

@Component({
  selector: "sm-new-menu",
  template: "<div></div>",
})
class MockNewMenuComponent {}

describe("IntegrationsAndSDKsComponent", () => {
  let fixture: ComponentFixture<IntegrationsAndSDKsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        IntegrationsAndSDKsComponent,
        IntegrationGridComponent,
        IntegrationCardComponent,
        MockHeaderComponent,
        MockNewMenuComponent,
        I18nPipe,
      ],
      providers: [
        {
          provide: I18nService,
          useValue: mock<I18nService>({ t: (key) => key }),
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(IntegrationsAndSDKsComponent);
    fixture.detectChanges();
  });

  it("divides Integrations & SDKS", () => {
    const [integrationList, sdkList] = fixture.debugElement.queryAll(
      By.directive(IntegrationGridComponent),
    );

    // Validate only expected names, as the data is constant
    expect(
      (integrationList.componentInstance as IntegrationGridComponent).integrations.map(
        (i) => i.name,
      ),
    ).toEqual(["githubActions", "gitlabCICD", "ansible"]);

    expect(
      (sdkList.componentInstance as IntegrationGridComponent).integrations.map((i) => i.name),
    ).toEqual(["cSharp", "cPlusPlus", "go", "java", "jsWebAssembly", "php", "python", "ruby"]);
  });
});

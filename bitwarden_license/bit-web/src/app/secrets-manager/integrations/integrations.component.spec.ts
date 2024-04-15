import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { mock } from "jest-mock-extended";

import { I18nService } from "../../../../../../libs/common/src/platform/abstractions/i18n.service";
import { I18nPipe } from "../../../../../../libs/components/src/shared/i18n.pipe";

import { IntegrationCardComponent } from "./integration-card/integration-card.component";
import { IntegrationGridComponent } from "./integration-grid/integration-grid.component";
import { IntegrationsComponent } from "./integrations.component";

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

describe("IntegrationsComponent", () => {
  let fixture: ComponentFixture<IntegrationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        IntegrationsComponent,
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
    fixture = TestBed.createComponent(IntegrationsComponent);
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
    ).toEqual(["GitHub Actions", "GitLab CI/CD", "Ansible"]);

    expect(
      (sdkList.componentInstance as IntegrationGridComponent).integrations.map((i) => i.name),
    ).toEqual(["C#", "C++", "Go", "Java", "JS WebAssembly", "php", "Python", "Ruby"]);
  });
});

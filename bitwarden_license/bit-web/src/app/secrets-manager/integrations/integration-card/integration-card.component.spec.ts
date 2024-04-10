import { ComponentFixture, TestBed } from "@angular/core/testing";

import { IntegrationCardComponent } from "./integration-card.component";

describe("IntegrationCardComponent", () => {
  let component: IntegrationCardComponent;
  let fixture: ComponentFixture<IntegrationCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [IntegrationCardComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IntegrationCardComponent);
    component = fixture.componentInstance;

    component.name = "Integration Name";
    component.image = "test-image.png";
    component.secondaryText = "Get started with integration";
    component.linkURL = "https://example.com/";

    fixture.detectChanges();
  });

  it("assigns link href", () => {
    const link = fixture.nativeElement.querySelector("a");

    expect(link.href).toBe("https://example.com/");
  });

  it("renders card body", () => {
    const name = fixture.nativeElement.querySelector("h3");
    const link = fixture.nativeElement.querySelector("a");

    expect(name.textContent).toBe("Integration Name");
    expect(link.textContent.trim()).toBe("Get started with integration");
  });

  it("assigns external rel attribute", () => {
    component.externalURL = true;
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector("a");

    expect(link.rel).toBe("noopener noreferrer");
  });
});

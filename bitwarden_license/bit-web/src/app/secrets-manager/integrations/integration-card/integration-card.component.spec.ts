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
    component.linkText = "Get started with integration";
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

  describe("new badge", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2023-09-01"));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("shows when expiration is in the future", () => {
      component.newBadgeExpiration = "2023-09-02";
      expect(component.showNewBadge()).toBe(true);
    });

    it("does not show when expiration is not set", () => {
      expect(component.showNewBadge()).toBe(false);
    });

    it("does not show when expiration is in the past", () => {
      component.newBadgeExpiration = "2023-08-31";
      expect(component.showNewBadge()).toBe(false);
    });

    it("does not show when expiration is today", () => {
      component.newBadgeExpiration = "2023-09-01";
      expect(component.showNewBadge()).toBe(false);
    });

    it("does not show when expiration is invalid", () => {
      component.newBadgeExpiration = "not-a-date";
      expect(component.showNewBadge()).toBe(false);
    });
  });
});

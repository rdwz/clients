import { Component, OnDestroy, OnInit } from "@angular/core";

import { SharedModule } from "../shared";

@Component({
  standalone: true,
  selector: "app-anon-layout-wrapper",
  templateUrl: "anon-layout-wrapper.component.html",
  imports: [SharedModule],
})
export class AnonLayoutWrapperComponent implements OnInit, OnDestroy {
  async ngOnInit() {
    document.body.classList.add("layout_frontend");
  }
  ngOnDestroy() {
    document.body.classList.remove("layout_frontend");
  }
}

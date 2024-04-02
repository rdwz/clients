import { Component, OnDestroy, OnInit } from "@angular/core";

import { SharedModule } from "../shared";

@Component({
  standalone: true,
  selector: "app-anonymous-layout",
  templateUrl: "anonymous-layout.component.html",
  imports: [SharedModule],
})
export class AnonymousLayoutComponent implements OnInit, OnDestroy {
  async ngOnInit() {
    document.body.classList.add("layout_frontend");
  }
  ngOnDestroy() {
    document.body.classList.remove("layout_frontend");
  }
}

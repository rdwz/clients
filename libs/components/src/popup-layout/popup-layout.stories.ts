import { CommonModule } from "@angular/common";
import { Meta, StoryObj, moduleMetadata } from "@storybook/angular";

import { ButtonModule } from "../button";

import {
  PopupLayoutComponent,
  PopupHeaderComponent,
  PopupFooterComponent,
} from "./popup-layout.component";

export default {
  title: "Browser/Popup Layout",
  component: PopupLayoutComponent,
  decorators: [
    moduleMetadata({
      imports: [
        PopupLayoutComponent,
        PopupHeaderComponent,
        PopupFooterComponent,
        CommonModule,
        ButtonModule,
      ],
    }),
  ],
} as Meta;

type Story = StoryObj<PopupLayoutComponent>;

export const Default: Story = {
  args: {
    headerVariant: "top-level",
    footerVariant: "top-level",
    activePage: "vault",
  },
  argTypes: {
    headerVariant: {
      options: ["top-level", "top-level-action", "sub-page"],
      control: { type: "select" },
    },
    footerVariant: {
      options: ["top-level", "sub-page-action", "sub-page"],
      control: { type: "select" },
    },
    activePage: {
      options: ["vault", "generator", "send", "settings"],
      control: { type: "select" },
    },
  },
  render: (args) => ({
    props: args,
    template: /* HTML */ `
      <popup-layout>
        <popup-header [variant]="headerVariant" popupHeader title="Test"></popup-header>
        <div>
          rest of content
          <div class="tw-my-8">lots of things</div>
          <div class="tw-my-8">lots of things</div>
          <div class="tw-my-8">lots of things</div>
          <div class="tw-my-8">lots of things</div>
          <div class="tw-my-8">lots of things</div>
          <div class="tw-my-8">lots of things</div>
          <div class="tw-my-8">lots of things</div>
          <div class="tw-my-8">lots of things</div>
          <div class="tw-my-8">lots of things</div>
          <div class="tw-my-8">lots of things</div>
          <div class="tw-my-8">lots of things</div>
          <div class="tw-my-8">lots of things</div>
          <div class="tw-my-8">lots of things last item</div>
        </div>
        <popup-footer [variant]="footerVariant" popupFooter [activePage]="activePage">
          <div *ngIf="footerVariant === 'sub-page-action'" actionFooter class="tw-flex tw-gap-2">
            <button bitButton buttonType="primary">Save</button>
            <button bitButton buttonType="secondary">Cancel</button>
          </div>
        </popup-footer>
      </popup-layout>
    `,
  }),
};

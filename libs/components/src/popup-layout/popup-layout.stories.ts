import { CommonModule } from "@angular/common";
import { Meta, StoryObj, moduleMetadata } from "@storybook/angular";

import { ButtonModule } from "../button";

import {
  PopupLayoutComponent,
  PopupHeaderComponent,
  PopupFooterComponent,
  PopupBottomNavigationComponent,
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
        PopupBottomNavigationComponent,
        CommonModule,
        ButtonModule,
      ],
    }),
  ],
} as Meta;

type Story = StoryObj<PopupLayoutComponent>;

export const TopLevelPage: Story = {
  args: {
    activePage: "vault",
  },
  argTypes: {
    activePage: {
      options: ["vault", "generator", "send", "settings"],
      control: { type: "select" },
    },
  },
  render: (args) => ({
    props: args,
    template: /* HTML */ `
      <popup-layout>
        <popup-header variant="top-level" popupHeader pageTitle="Test"></popup-header>
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
        <popup-bottom-navigation popupFooter [activePage]="activePage"></popup-bottom-navigation>
      </popup-layout>
    `,
  }),
};

export const TopLevelWithAction: Story = {
  args: {
    activePage: "vault",
  },
  argTypes: {
    activePage: {
      options: ["vault", "generator", "send", "settings"],
      control: { type: "select" },
    },
  },
  render: (args) => ({
    props: args,
    template: /* HTML */ `
      <popup-layout>
        <popup-header variant="top-level-action" popupHeader pageTitle="Test"></popup-header>
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
        <popup-bottom-navigation popupFooter [activePage]="activePage"></popup-bottom-navigation>
      </popup-layout>
    `,
  }),
};

export const SubPageWithAction: Story = {
  render: (args) => ({
    props: args,
    template: /* HTML */ `
      <popup-layout>
        <popup-header variant="sub-page" popupHeader pageTitle="Test"></popup-header>
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
        <popup-footer popupFooter>
          <div actionFooter class="tw-flex tw-gap-2">
            <button bitButton buttonType="primary">Save</button>
            <button bitButton buttonType="secondary">Cancel</button>
          </div>
        </popup-footer>
      </popup-layout>
    `,
  }),
};

export const SubPage: Story = {
  render: (args) => ({
    props: args,
    template: /* HTML */ `
      <popup-layout>
        <popup-header variant="sub-page" popupHeader pageTitle="Test"></popup-header>
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
      </popup-layout>
    `,
  }),
};

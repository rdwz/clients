import { Meta, StoryObj, moduleMetadata } from "@storybook/angular";

import { ToastComponent } from "./toast.component";

export default {
  title: "Component Library/Toast",
  component: ToastComponent,
  decorators: [
    moduleMetadata({
      imports: [],
    }),
  ],
} as Meta;

type Story = StoryObj<ToastComponent>;

export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div class="tw-flex tw-flex-col">
        <bit-toast text="Hello world!" progressBarWidth="50" type="success"></bit-toast>
        <bit-toast text="Hello world!" progressBarWidth="50" type="info"></bit-toast>
        <bit-toast text="Hello world!" progressBarWidth="50" type="warning"></bit-toast>
        <bit-toast text="Hello world!" progressBarWidth="50" type="error"></bit-toast>
      </div>
    `,
  }),
};

export const LongContent: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div class="tw-flex tw-flex-col">
        <bit-toast text="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." progressBarWidth="50" type="success"></bit-toast>
        <bit-toast text="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." progressBarWidth="50" type="info"></bit-toast>
        <bit-toast text="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." progressBarWidth="50" type="warning"></bit-toast>
        <bit-toast text="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." progressBarWidth="50" type="error"></bit-toast>
      </div>
    `,
  }),
};

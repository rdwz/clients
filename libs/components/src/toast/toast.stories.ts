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
        <bit-toast message="Hello world!" progressWidth="50" variant="success"></bit-toast>
        <bit-toast message="Hello world!" progressWidth="50" variant="info"></bit-toast>
        <bit-toast message="Hello world!" progressWidth="50" variant="warning"></bit-toast>
        <bit-toast message="Hello world!" progressWidth="50" variant="error"></bit-toast>
      </div>
    `,
  }),
};

export const LongContent: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div class="tw-flex tw-flex-col">
        <bit-toast message="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." progressWidth="50" variant="success"></bit-toast>
        <bit-toast message="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." progressWidth="50" variant="info"></bit-toast>
        <bit-toast message="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." progressWidth="50" variant="warning"></bit-toast>
        <bit-toast message="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." progressWidth="50" variant="error"></bit-toast>
      </div>
    `,
  }),
};

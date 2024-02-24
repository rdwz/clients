import { action } from "@storybook/addon-actions";
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
  args: {
    onClose: action("emit onClose"),
  },
} as Meta;

type Story = StoryObj<ToastComponent>;

/**
 * Avoid using long messages in toasts.
 */
export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div class="tw-flex tw-flex-col">
        <bit-toast [title]="title" [message]="message" [progressWidth]="progressWidth" (onClose)="onClose()" variant="success"></bit-toast>
        <bit-toast [title]="title" [message]="message" [progressWidth]="progressWidth" (onClose)="onClose()" variant="info"></bit-toast>
        <bit-toast [title]="title" [message]="message" [progressWidth]="progressWidth" (onClose)="onClose()" variant="warning"></bit-toast>
        <bit-toast [title]="title" [message]="message" [progressWidth]="progressWidth" (onClose)="onClose()" variant="error"></bit-toast>
      </div>
    `,
  }),
  args: {
    title: "",
    message: "Hello Bitwarden!",
    progressWidth: 50,
  },
};

export const LongContent: Story = {
  ...Default,
  args: {
    title: "Foo",
    message: [
      "Lorem ipsum dolor sit amet, consectetur adipisci",
      "Lorem ipsum dolor sit amet, consectetur adipisci",
    ],
    progressWidth: 50,
  },
};

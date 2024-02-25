import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { action } from "@storybook/addon-actions";
import { Meta, StoryObj, applicationConfig, moduleMetadata } from "@storybook/angular";

import { ButtonModule } from "../button";

import { ToastComponent } from "./toast.component";
import { ToastModule } from "./toast.module";
import { ToastOptions, ToastService } from "./toast.service";

const toastServiceExampleTemplate = `
  <button bitButton type="button" (click)="toastService.showToast(toastOptions)">Show Toast</button>
`;
@Component({
  selector: "toast-service-example",
  template: toastServiceExampleTemplate,
})
export class ToastServiceExampleComponent {
  @Input()
  toastOptions: ToastOptions;

  constructor(protected toastService: ToastService) {}
}

export default {
  title: "Component Library/Toast",
  component: ToastComponent,
  args: {
    onClose: action("emit onClose"),
    variant: "info",
    progressWidth: 50,
    title: "",
    message: "Hello Bitwarden!",
  },
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/Zt3YSeb6E6lebAffrNLa0h/Tailwind-Component-Library",
    },
  },
} as Meta;

type Story = StoryObj<ToastComponent>;

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
};

/**
 * Avoid using long messages in toasts.
 */
export const LongContent: Story = {
  ...Default,
  args: {
    title: "Foo",
    message: [
      "Lorem ipsum dolor sit amet, consectetur adipisci",
      "Lorem ipsum dolor sit amet, consectetur adipisci",
    ],
  },
};

export const Service: Story = {
  render: (args) => ({
    props: {
      toastOptions: args,
    },
    template: `
      <toast-service-example [toastOptions]="toastOptions"></toast-service-example>
    `,
  }),
  args: {
    title: "",
    message: "Hello Bitwarden!",
    variant: "error",
  },
  decorators: [
    moduleMetadata({
      imports: [CommonModule, BrowserAnimationsModule, ButtonModule],
      declarations: [ToastServiceExampleComponent],
    }),
    applicationConfig({
      providers: [ToastModule.forRoot().providers],
    }),
  ],
  parameters: {
    chromatic: { disableSnapshot: true },
    docs: {
      source: {
        code: toastServiceExampleTemplate,
      },
    },
  },
};

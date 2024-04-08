import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

import AutofillScript from "../../models/autofill-script";

export type AutofillExtensionMessage = {
  command: string;
  tab?: chrome.tabs.Tab;
  sender?: string;
  fillScript?: AutofillScript;
  url?: string;
  subFrameUrl?: string;
  subFrameId?: string;
  pageDetailsUrl?: string;
  ciphers?: any;
  isInlineMenuHidden?: boolean;
  overlayElement?: string;
  isFocusingFieldElement?: boolean;
  authStatus?: AuthenticationStatus;
  isOpeningFullOverlay?: boolean;
  data?: {
    isOverlayCiphersPopulated?: boolean;
    direction?: "previous" | "next" | "current";
    forceCloseOverlay?: boolean;
    autofillOverlayVisibility?: number;
  };
};

export type AutofillExtensionMessageParam = { message: AutofillExtensionMessage };

export type AutofillExtensionMessageHandlers = {
  [key: string]: CallableFunction;
  collectPageDetails: ({ message }: AutofillExtensionMessageParam) => void;
  collectPageDetailsImmediately: ({ message }: AutofillExtensionMessageParam) => void;
  fillForm: ({ message }: AutofillExtensionMessageParam) => void;
};

export interface AutofillInit {
  init(): void;
  destroy(): void;
}

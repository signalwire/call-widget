import C2CWidget from "./C2CWidget.ts";
import CallWidget from "./elements/call-widget/CallWidget.ts";
import { showContactForm } from "./lib/contactForm.ts";
import type {
  ContactFormData,
  ContactFormCallbacks,
} from "./lib/contactForm.ts";
import "./types.d.ts";

export { C2CWidget, CallWidget, showContactForm };
export type { ContactFormData, ContactFormCallbacks };

import type { DetailedHTMLProps, HTMLAttributes } from "react";

// Custom element types
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "c2c-widget": DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          token?: string;
          buttonId?: string;
          callDetails?: string;
        },
        HTMLElement
      >;
    }
  }
}

// Environment
interface ImportMetaEnv {
  readonly VITE_PUBLIC_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// HTML template helper
declare const html: (
  strings: TemplateStringsArray,
  ...values: any[]
) => Record<string, HTMLElement>;

declare module "*.html.ts" {
  const template: () => Record<string, HTMLElement>;
  export default template;
}

export {};

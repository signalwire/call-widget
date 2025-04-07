declare module "*.css?inline" {
  const content: string;
  export default content;
}
declare module "*.scss?inline" {
  const content: string;
  export default content;
}

declare module "*.svg?raw" {
  const content: string;
  export default content;
}

interface ImportMetaEnv {
  readonly VITE_PUBLIC_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const html: (
  strings: TemplateStringsArray,
  ...values: any[]
) => Record<string, HTMLElement>;

declare module "*.html.ts" {
  const template: () => Record<string, HTMLElement>;

  export default template;
}

// Asset imports
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

declare module "*.svg" {
  const content: string;
  export default content;
}

export class Style {
  private static instance: Style;
  private styles: Map<string, string> = new Map();

  private constructor() {}

  static getInstance(): Style {
    if (!Style.instance) {
      Style.instance = new Style();
    }
    return Style.instance;
  }

  // checking the first 20 and last 20 chars of the stylesheet,
  // and the length, as a simple hashing heuristic to avoid
  // duplications.
  register(styleString: string): void {
    const len = styleString.length;
    const key =
      len > 40
        ? `${len}:${styleString.slice(0, 20)}:${styleString.slice(-20)}`
        : `${len}:${styleString}`;

    if (!this.styles.has(key)) {
      this.styles.set(key, styleString);
    }
  }

  apply(shadowRoot: ShadowRoot): void {
    const styleElement = document.createElement("style");
    styleElement.textContent = Array.from(this.styles.values()).join("\n");
    shadowRoot.appendChild(styleElement);
  }
}

export const style = Style.getInstance();

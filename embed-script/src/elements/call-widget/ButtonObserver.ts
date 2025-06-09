export class ButtonObserver {
  private observer: MutationObserver | null = null;
  private buttonId: string;
  private onClick: () => void;
  private button: HTMLElement | null = null;

  constructor(buttonId: string, onClick: () => void) {
    this.buttonId = buttonId;
    this.onClick = onClick;
    this.setupButton();
  }

  private setupButton() {
    const button = document.getElementById(this.buttonId);
    if (button) {
      this.button = button;
      this.attachClickHandler(button);
    } else {
      this.startObserving();
    }
  }

  private attachClickHandler(button: HTMLElement) {
    if (button.classList.contains("demo-button-disabled")) {
      button.classList.remove("demo-button-disabled");
    }
    button.addEventListener("click", this.handleClick);
  }

  private handleClick = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    this.onClick();
  };

  private startObserving() {
    this.observer = new MutationObserver((_, obs) => {
      const button = document.getElementById(this.buttonId);
      if (button) {
        this.button = button;
        this.attachClickHandler(button);
        obs.disconnect();
        this.observer = null;
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  disconnectObserver() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  destroy() {
    if (this.button) {
      this.button.removeEventListener("click", this.handleClick);
      this.button = null;
    }
    this.disconnectObserver();
  }
}

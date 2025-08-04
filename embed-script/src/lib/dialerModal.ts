interface DialerCallbacks {
  onDial: (number: string) => void;
  onCancel: () => void;
}

interface DialerOptions {
  callbacks: DialerCallbacks;
  title?: string;
}

class DialerModal {
  public element: HTMLElement;
  private shadow: ShadowRoot;
  private callbacks: DialerCallbacks;
  private currentNumber: string = "";
  private title: string;
  private longPressTimer: number | null = null;
  private backspaceInterval: number | null = null;
  private isLongPressing: boolean = false;

  constructor(options: DialerOptions) {
    this.callbacks = options.callbacks;
    this.title = options.title || "Dial Number";
    this.element = document.createElement("div");
    this.shadow = this.element.attachShadow({ mode: "closed" });
    this.render();
    this.attachEventListeners();
  }

  private render() {
    this.shadow.innerHTML = `
      <style>
        :host {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .modal-content {
          background: #1c1c1e;
          border-radius: 20px;
          padding: 24px;
          width: 90%;
          max-width: 320px;
          position: relative;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          color: white;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .modal-title {
          font-size: 20px;
          font-weight: 600;
          margin: 0;
          color: white;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: #8e8e93;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          transition: background-color 0.2s;
        }

        .close-button:hover {
          background-color: rgba(142, 142, 147, 0.2);
        }

        .number-display {
          background: #2c2c2e;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
          min-height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: 300;
          letter-spacing: 2px;
          word-break: break-all;
          color: white;
          border: 1px solid #3a3a3c;
        }

        .number-display.empty {
          color: #8e8e93;
          font-size: 18px;
        }

        .keypad {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .key-button {
          aspect-ratio: 1;
          background: #3a3a3c;
          border: none;
          border-radius: 50%;
          font-size: 28px;
          font-weight: 300;
          color: white;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 64px;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }

        .key-button:hover {
          background: #48484a;
          transform: scale(1.05);
        }

        .key-button:active {
          background: #5a5a5c;
          transform: scale(0.95);
        }

        .key-button.number {
          flex-direction: column;
          padding: 8px;
        }

        .key-number {
          font-size: 32px;
          font-weight: 300;
          line-height: 1;
        }

        .key-letters {
          font-size: 11px;
          font-weight: 500;
          color: #8e8e93;
          margin-top: 2px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .action-buttons {
          display: flex;
          gap: 16px;
          justify-content: space-between;
        }

        .action-button {
          flex: 1;
          height: 56px;
          border: none;
          border-radius: 28px;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }

        .dial-button {
          background: #34c759;
          color: white;
        }

        .dial-button:hover {
          background: #30d158;
          transform: translateY(-1px);
        }

        .dial-button:active {
          background: #28a745;
        }

        .dial-button:disabled {
          background: #48484a;
          color: #8e8e93;
          cursor: not-allowed;
          transform: none;
        }

        .backspace-button {
          background: #3a3a3c;
          color: white;
          max-width: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .backspace-button:hover {
          background: #48484a;
        }

        .backspace-button:active {
          background: #5a5a5c;
        }

        .backspace-button:disabled {
          background: #2c2c2e;
          color: #48484a;
          cursor: not-allowed;
        }

        @media (max-width: 480px) {
          .modal-content {
            width: 95%;
            padding: 20px;
          }
          
          .key-button {
            min-height: 56px;
          }
          
          .key-number {
            font-size: 28px;
          }
        }
      </style>
      
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title">${this.title}</h2>
          <button class="close-button" id="closeModal">&times;</button>
        </div>
        
        <div class="number-display empty" id="numberDisplay">
          Enter number
        </div>
        
        <div class="keypad">
          <button class="key-button number" data-key="1">
            <span class="key-number">1</span>
          </button>
          <button class="key-button number" data-key="2">
            <span class="key-number">2</span>
            <span class="key-letters">ABC</span>
          </button>
          <button class="key-button number" data-key="3">
            <span class="key-number">3</span>
            <span class="key-letters">DEF</span>
          </button>
          
          <button class="key-button number" data-key="4">
            <span class="key-number">4</span>
            <span class="key-letters">GHI</span>
          </button>
          <button class="key-button number" data-key="5">
            <span class="key-number">5</span>
            <span class="key-letters">JKL</span>
          </button>
          <button class="key-button number" data-key="6">
            <span class="key-number">6</span>
            <span class="key-letters">MNO</span>
          </button>
          
          <button class="key-button number" data-key="7">
            <span class="key-number">7</span>
            <span class="key-letters">PQRS</span>
          </button>
          <button class="key-button number" data-key="8">
            <span class="key-number">8</span>
            <span class="key-letters">TUV</span>
          </button>
          <button class="key-button number" data-key="9">
            <span class="key-number">9</span>
            <span class="key-letters">WXYZ</span>
          </button>
          
          <button class="key-button" data-key="*">
            <span class="key-number">*</span>
          </button>
          <button class="key-button number" data-key="0">
            <span class="key-number">0</span>
            <span class="key-letters">+</span>
          </button>
          <button class="key-button" data-key="#">
            <span class="key-number">#</span>
          </button>
        </div>
        
        <div class="action-buttons">
          <button class="action-button backspace-button" id="backspaceButton" disabled>
            ⌫
          </button>
          <button class="action-button dial-button" id="dialButton" disabled>
            Call
          </button>
        </div>
      </div>
    `;
  }

  private attachEventListeners() {
    const closeButton = this.shadow.getElementById("closeModal");
    const dialButton = this.shadow.getElementById("dialButton");
    const backspaceButton = this.shadow.getElementById("backspaceButton");
    const modalContent = this.shadow.querySelector(".modal-content");
    const keyButtons = this.shadow.querySelectorAll("[data-key]");
    // const zeroButton = this.shadow.querySelector('[data-key="0"]');

    closeButton?.addEventListener("click", () => {
      this.handleCancel();
    });

    this.element.addEventListener("click", (event) => {
      if (event.target === this.element) {
        this.handleCancel();
      }
    });

    modalContent?.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    keyButtons.forEach((button) => {
      const key = button.getAttribute("data-key");

      if (key === "0") {
        // Special handling for "0" button with long press for "+"
        this.attachLongPressToZero(button as HTMLElement);
      } else {
        button.addEventListener("click", () => {
          if (key) {
            this.addDigit(key);
          }
        });
      }
    });

    // Special handling for backspace with long press
    if (backspaceButton) {
      this.attachLongPressToBackspace(backspaceButton);
    }

    dialButton?.addEventListener("click", () => {
      this.handleDial();
    });

    document.addEventListener("keydown", this.handleKeydown.bind(this));
  }

  private handleKeydown = (event: KeyboardEvent) => {
    if (!document.body.contains(this.element)) {
      document.removeEventListener("keydown", this.handleKeydown);
      return;
    }

    const key = event.key;

    if ((key >= "0" && key <= "9") || key === "*" || key === "#") {
      event.preventDefault();
      this.addDigit(key);
    } else if (key === "Backspace") {
      event.preventDefault();
      this.removeLastDigit();
    } else if (key === "Enter") {
      event.preventDefault();
      if (this.currentNumber) {
        this.handleDial();
      }
    } else if (key === "Escape") {
      event.preventDefault();
      this.handleCancel();
    }
  };

  private attachLongPressToZero(button: HTMLElement) {
    const startLongPress = () => {
      this.isLongPressing = false;
      this.longPressTimer = window.setTimeout(() => {
        this.isLongPressing = true;
        this.addDigit("+");
      }, 500); // 500ms for long press
    };

    const endLongPress = () => {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }

      if (!this.isLongPressing) {
        // Short press - add "0"
        this.addDigit("0");
      }

      this.isLongPressing = false;
    };

    const cancelLongPress = () => {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
      this.isLongPressing = false;
    };

    // Mouse events
    button.addEventListener("mousedown", (e) => {
      e.preventDefault();
      startLongPress();
    });

    button.addEventListener("mouseup", (e) => {
      e.preventDefault();
      endLongPress();
    });

    button.addEventListener("mouseleave", () => {
      cancelLongPress();
    });

    // Touch events
    button.addEventListener("touchstart", (e) => {
      e.preventDefault();
      startLongPress();
    });

    button.addEventListener("touchend", (e) => {
      e.preventDefault();
      endLongPress();
    });

    button.addEventListener("touchcancel", () => {
      cancelLongPress();
    });
  }

  private attachLongPressToBackspace(button: HTMLElement) {
    let isLongPressing = false;

    const startBackspaceLongPress = () => {
      isLongPressing = false;
      this.longPressTimer = window.setTimeout(() => {
        isLongPressing = true;
        // Start continuous backspace
        this.backspaceInterval = window.setInterval(() => {
          this.removeLastDigit();
        }, 100); // Remove digit every 100ms
      }, 500); // 500ms delay before continuous backspace starts
    };

    const endBackspaceLongPress = () => {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }

      if (this.backspaceInterval) {
        clearInterval(this.backspaceInterval);
        this.backspaceInterval = null;
      }

      if (!isLongPressing) {
        // Short press - single backspace
        this.removeLastDigit();
      }

      isLongPressing = false;
    };

    const cancelBackspaceLongPress = () => {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }

      if (this.backspaceInterval) {
        clearInterval(this.backspaceInterval);
        this.backspaceInterval = null;
      }

      isLongPressing = false;
    };

    // Mouse events
    button.addEventListener("mousedown", (e) => {
      e.preventDefault();
      startBackspaceLongPress();
    });

    button.addEventListener("mouseup", (e) => {
      e.preventDefault();
      endBackspaceLongPress();
    });

    button.addEventListener("mouseleave", () => {
      cancelBackspaceLongPress();
    });

    // Touch events
    button.addEventListener("touchstart", (e) => {
      e.preventDefault();
      startBackspaceLongPress();
    });

    button.addEventListener("touchend", (e) => {
      e.preventDefault();
      endBackspaceLongPress();
    });

    button.addEventListener("touchcancel", () => {
      cancelBackspaceLongPress();
    });
  }

  private addDigit(digit: string) {
    this.currentNumber += digit;
    this.updateDisplay();
  }

  private removeLastDigit() {
    if (this.currentNumber.length > 0) {
      this.currentNumber = this.currentNumber.slice(0, -1);
      this.updateDisplay();
    }
  }

  private updateDisplay() {
    const display = this.shadow.getElementById("numberDisplay");
    const dialButton = this.shadow.getElementById(
      "dialButton"
    ) as HTMLButtonElement;
    const backspaceButton = this.shadow.getElementById(
      "backspaceButton"
    ) as HTMLButtonElement;

    if (display) {
      if (this.currentNumber) {
        display.textContent = this.currentNumber;
        display.classList.remove("empty");
        dialButton.disabled = false;
        backspaceButton.disabled = false;
      } else {
        display.textContent = "Enter number";
        display.classList.add("empty");
        dialButton.disabled = true;
        backspaceButton.disabled = true;
      }
    }
  }

  private handleCancel() {
    this.cleanup();
    this.callbacks.onCancel();
    this.element.remove();
  }

  private handleDial() {
    if (this.currentNumber) {
      this.cleanup();
      this.callbacks.onDial(this.currentNumber);
      this.element.remove();
    }
  }

  private cleanup() {
    document.removeEventListener("keydown", this.handleKeydown);

    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    if (this.backspaceInterval) {
      clearInterval(this.backspaceInterval);
      this.backspaceInterval = null;
    }

    this.isLongPressing = false;
  }
}

export function showDialer(callbacks: DialerCallbacks, title?: string): void {
  const modal = new DialerModal({ callbacks, title });
  document.body.appendChild(modal.element);
}

export type { DialerCallbacks, DialerOptions };

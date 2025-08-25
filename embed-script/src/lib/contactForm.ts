interface ContactFormData {
  name: string;
  email: string;
  number: string;
}

interface ContactFormCallbacks {
  onSubmit: (data: ContactFormData) => void;
  onCancel: () => void;
}

interface ContactFormOptions {
  callbacks: ContactFormCallbacks;
  widget?: HTMLElement;
}

class ContactFormModal {
  public element: HTMLElement;
  private shadow: ShadowRoot;
  private callbacks: ContactFormCallbacks;
  private widget?: HTMLElement;
  private static readonly STORAGE_KEY = "signalwire-contact-form-data";

  constructor(options: ContactFormOptions) {
    this.callbacks = options.callbacks;
    this.widget = options.widget;
    this.element = document.createElement("div");
    this.shadow = this.element.attachShadow({ mode: "closed" });
    this.render();
    this.attachEventListeners();
    this.loadCachedData();
  }

  private getCachedData(): ContactFormData | null {
    try {
      const cached = localStorage.getItem(ContactFormModal.STORAGE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  private saveCachedData(data: ContactFormData): void {
    try {
      localStorage.setItem(ContactFormModal.STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Silently fail if localStorage is not available
    }
  }

  private clearCachedData(): void {
    try {
      localStorage.removeItem(ContactFormModal.STORAGE_KEY);
    } catch {
      // Silently fail if localStorage is not available
    }
  }

  private loadCachedData(): void {
    const cachedData = this.getCachedData();
    if (cachedData) {
      const nameInput = this.shadow.getElementById("name") as HTMLInputElement;
      const emailInput = this.shadow.getElementById(
        "email"
      ) as HTMLInputElement;
      const numberInput = this.shadow.getElementById(
        "number"
      ) as HTMLInputElement;
      const indicator = this.shadow.getElementById("cachedIndicator");

      if (nameInput) nameInput.value = cachedData.name;
      if (emailInput) emailInput.value = cachedData.email;
      if (numberInput) numberInput.value = cachedData.number;
      if (indicator) indicator.style.display = "block";
    }
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
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          padding: 24px;
          width: 90%;
          max-width: 400px;
          position: relative;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          position: relative;
        }

        .modal-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .header-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .reset-button {
          background: linear-gradient(135deg, #ff6b6b, #ee5a24);
          border: none;
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          cursor: pointer;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(238, 90, 36, 0.3);
        }

        .reset-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(238, 90, 36, 0.4);
        }

        .reset-button:active {
          transform: translateY(0);
        }

        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .close-button:hover {
          color: #333;
          transform: scale(1.1);
        }

        .cached-indicator {
          position: absolute;
          top: -8px;
          right: -8px;
          background: linear-gradient(135deg, #00b894, #00a085);
          color: white;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 8px;
          font-weight: 500;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: #333;
        }

        .form-input {
          width: 100%;
          padding: 12px;
          border: 2px solid transparent;
          border-radius: 8px;
          font-size: 14px;
          box-sizing: border-box;
          background: linear-gradient(white, white) padding-box, 
                      linear-gradient(135deg, #667eea, #764ba2) border-box;
          transition: all 0.3s ease;
        }

        .form-input:focus {
          outline: none;
          background: linear-gradient(white, white) padding-box, 
                      linear-gradient(135deg, #00b894, #00a085) border-box;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 184, 148, 0.15);
        }

        .form-input:not(:placeholder-shown) {
          background: linear-gradient(#f8f9ff, white) padding-box, 
                      linear-gradient(135deg, #667eea, #764ba2) border-box;
        }

        .continue-button {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 10px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .continue-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
        }

        .continue-button:active {
          transform: translateY(-1px);
        }

        .continue-button:disabled {
          background: #ccc;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        @media (max-width: 480px) {
          .modal-content {
            width: 95%;
            padding: 20px;
          }
        }
      </style>
      
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title">Contact Information</h2>
          <div class="header-actions">
            <button class="reset-button" id="resetForm">Reset</button>
            <button class="close-button" id="closeModal">&times;</button>
          </div>
          <div class="cached-indicator" id="cachedIndicator" style="display: none;">Saved</div>
        </div>
        <form id="contactForm">
          <div class="form-group">
            <label class="form-label" for="name">Name</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              class="form-input" 
              required 
              placeholder="Enter your name"
            />
          </div>
          <div class="form-group">
            <label class="form-label" for="email">Email</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              class="form-input" 
              required 
              placeholder="Enter your email"
            />
          </div>
          <div class="form-group">
            <label class="form-label" for="number">Phone Number</label>
            <input 
              type="tel" 
              id="number" 
              name="number" 
              class="form-input" 
              required 
              placeholder="Enter your phone number"
            />
          </div>
          <button type="submit" class="continue-button">Continue</button>
        </form>
      </div>
    `;
  }

  private attachEventListeners() {
    const closeButton = this.shadow.getElementById("closeModal");
    const resetButton = this.shadow.getElementById("resetForm");
    const form = this.shadow.getElementById("contactForm") as HTMLFormElement;
    const modalContent = this.shadow.querySelector(".modal-content");

    closeButton?.addEventListener("click", () => {
      this.handleCancel();
    });

    resetButton?.addEventListener("click", () => {
      this.handleReset();
    });

    // Listen for clicks on the host element (backdrop)
    this.element.addEventListener("click", (event) => {
      // Only close if clicking directly on the backdrop (the host element)
      if (event.target === this.element) {
        this.handleCancel();
      }
    });

    // Prevent modal content clicks from bubbling up to the host
    modalContent?.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      this.handleSubmit(form);
    });
  }

  private handleCancel() {
    this.callbacks.onCancel();
    this.element.remove();
  }

  private handleReset() {
    this.clearCachedData();

    const nameInput = this.shadow.getElementById("name") as HTMLInputElement;
    const emailInput = this.shadow.getElementById("email") as HTMLInputElement;
    const numberInput = this.shadow.getElementById(
      "number"
    ) as HTMLInputElement;
    const indicator = this.shadow.getElementById("cachedIndicator");

    if (nameInput) nameInput.value = "";
    if (emailInput) emailInput.value = "";
    if (numberInput) numberInput.value = "";
    if (indicator) indicator.style.display = "none";

    // Add a little animation feedback
    const resetButton = this.shadow.getElementById("resetForm");
    if (resetButton) {
      resetButton.textContent = "Cleared!";
      setTimeout(() => {
        resetButton.textContent = "Reset";
      }, 1000);
    }
  }

  private handleSubmit(form: HTMLFormElement) {
    const formData = new FormData(form);
    const data: ContactFormData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      number: formData.get("number") as string,
    };

    // Save to cache
    this.saveCachedData(data);

    // Set user variables on the widget if provided
    if (this.widget) {
      const userVariables = {
        userName: data.name,
        userEmail: data.email,
        userPhone: data.number,
      };
      this.widget.setAttribute("user-variables", JSON.stringify(userVariables));
    }

    this.callbacks.onSubmit(data);
    this.element.remove();
  }
}

export function showContactForm(
  callbacks: ContactFormCallbacks,
  widget?: HTMLElement
): void {
  const modal = new ContactFormModal({ callbacks, widget });
  document.body.appendChild(modal.element);
}

export type { ContactFormData, ContactFormCallbacks, ContactFormOptions };

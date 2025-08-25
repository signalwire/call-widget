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

      if (nameInput) nameInput.value = cachedData.name;
      if (emailInput) emailInput.value = cachedData.email;
      if (numberInput) numberInput.value = cachedData.number;
    }
  }

  private render() {
    this.shadow.innerHTML = `
      <style>
        * {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
          box-sizing: border-box;
        }

        :host {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.4);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
        }

        .modal-content {
          background: #ffffff !important;
          color: #374151 !important;
          border-radius: 6px;
          padding: 24px;
          width: 90%;
          max-width: 400px;
          position: relative;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
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
          color: #374151 !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
        }

        .header-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .reset-button {
          background: #6b7280 !important;
          border: none;
          color: #ffffff !important;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          cursor: pointer;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
        }

        .reset-button:hover {
          background: #4b5563 !important;
        }

        .reset-button:active {
          background: #374151 !important;
        }

        .close-button {
          background: none !important;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #6b7280 !important;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
        }

        .close-button:hover {
          color: #374151 !important;
        }



        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: #374151 !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
        }

        .form-input {
          width: 100%;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 14px;
          box-sizing: border-box;
          background: #ffffff !important;
          color: #374151 !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
        }

        .form-input::placeholder {
          color: #9ca3af !important;
          opacity: 1;
        }

        .form-input:focus {
          outline: none;
          border-color: #4b5563;
          box-shadow: 0 0 0 1px #4b5563;
          background: #ffffff !important;
          color: #374151 !important;
        }

        .form-input:not(:placeholder-shown) {
          background: #f9fafb !important;
          border-color: #9ca3af;
          color: #374151 !important;
        }

        .continue-button {
          width: 100%;
          padding: 12px;
          background: #374151 !important;
          color: #ffffff !important;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          margin-top: 10px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
        }

        .continue-button:hover {
          background: #1f2937 !important;
        }

        .continue-button:active {
          background: #111827 !important;
        }

        .continue-button:disabled {
          background: #d1d5db !important;
          color: #6b7280 !important;
          cursor: not-allowed;
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

    if (nameInput) nameInput.value = "";
    if (emailInput) emailInput.value = "";
    if (numberInput) numberInput.value = "";

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

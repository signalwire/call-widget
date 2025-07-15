interface ContactFormData {
  name: string;
  email: string;
  number: string;
}

interface ContactFormCallbacks {
  onSubmit: (data: ContactFormData) => void;
  onCancel: () => void;
}

class ContactFormModal {
  public element: HTMLElement;
  private shadow: ShadowRoot;
  private callbacks: ContactFormCallbacks;

  constructor(callbacks: ContactFormCallbacks) {
    this.callbacks = callbacks;
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
        }

        .modal-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
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
        }

        .close-button:hover {
          color: #333;
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
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          box-sizing: border-box;
        }

        .form-input:focus {
          outline: none;
          border-color: #007bff;
        }

        .continue-button {
          width: 100%;
          padding: 12px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          margin-top: 10px;
        }

        .continue-button:hover {
          background-color: #0056b3;
        }

        .continue-button:disabled {
          background-color: #ccc;
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
          <button class="close-button" id="closeModal">&times;</button>
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
    const form = this.shadow.getElementById("contactForm") as HTMLFormElement;
    const modalContent = this.shadow.querySelector(".modal-content");

    closeButton?.addEventListener("click", () => {
      this.handleCancel();
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

  private handleSubmit(form: HTMLFormElement) {
    const formData = new FormData(form);
    const data: ContactFormData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      number: formData.get("number") as string,
    };

    this.callbacks.onSubmit(data);
    this.element.remove();
  }
}

export function showContactForm(callbacks: ContactFormCallbacks): void {
  const modal = new ContactFormModal(callbacks);
  document.body.appendChild(modal.element);
}

export type { ContactFormData, ContactFormCallbacks };

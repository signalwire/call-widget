import { style } from "../../Style.ts";

export class CallInfoModal extends HTMLElement {
  shadow = this.attachShadow({ mode: "open" });
  private resolvePromise: ((value: boolean) => void) | null = null;

  constructor() {
    super();
    style.apply(this.shadow);
  }

  show(title: string, message: string): Promise<boolean> {
    const modal = document.createElement("div");
    modal.className = "info-modal";

    modal.innerHTML = `
      <div class="info-modal-content">
        <h2>${title}</h2>
        <p>${message}</p>
        <button class="ok-button">OK</button>
      </div>
    `;

    const styleElement = document.createElement("style");
    styleElement.textContent = `
      .info-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      }

      .info-modal-content {
        background: white;
        padding: 20px;
        border-radius: 8px;
        max-width: 400px;
        text-align: center;
      }

      .ok-button {
        padding: 8px 16px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 16px;
      }

      .ok-button:hover {
        background: #0056b3;
      }
    `;

    this.shadow.appendChild(styleElement);
    this.shadow.appendChild(modal);

    return new Promise<boolean>((resolve) => {
      this.resolvePromise = resolve;
      const okButton = modal.querySelector(".ok-button");
      okButton?.addEventListener("click", () => this.handleOk());
    });
  }

  private handleOk() {
    if (this.resolvePromise) {
      this.resolvePromise(true);
      this.resolvePromise = null;
    }
    this.shadow.innerHTML = "";
  }
}

customElements.define("call-info-modal", CallInfoModal);

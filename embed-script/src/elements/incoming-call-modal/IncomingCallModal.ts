import callEndIcon from "../../icons/callEnd.svg?raw";

export class IncomingCallModal extends HTMLElement {
  shadow = this.attachShadow({ mode: "open" });

  constructor() {
    super();
  }

  async show(callerName: string, callerNumber: string) {
    const overlay = document.createElement("div");
    overlay.classList.add("overlay");

    const container = document.createElement("div");
    container.classList.add("incoming-call-modal");

    const content = document.createElement("div");
    content.classList.add("content");

    const title = document.createElement("h2");
    title.textContent = "Incoming Call";

    const callerInfo = document.createElement("div");
    callerInfo.classList.add("caller-info");
    callerInfo.innerHTML = `
      <p class="caller-name">${callerName || "Unknown"}</p>
      <p class="caller-number">${callerNumber || "Unknown"}</p>
    `;

    const buttonContainer = document.createElement("div");
    buttonContainer.classList.add("button-container");

    const acceptButton = document.createElement("button");
    acceptButton.classList.add("accept");
    acceptButton.innerHTML = `<svg viewBox="0 0 24 24" height="24px" width="24px"><path fill="currentColor" d="M6.62 10.79c1.44 2.83 3.76 5.15 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.24.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>`;

    const declineButton = document.createElement("button");
    declineButton.classList.add("decline");
    declineButton.innerHTML = callEndIcon;

    buttonContainer.appendChild(acceptButton);
    buttonContainer.appendChild(declineButton);

    content.appendChild(title);
    content.appendChild(callerInfo);
    content.appendChild(buttonContainer);
    container.appendChild(content);

    const style = document.createElement("style");
    style.textContent = `
      .overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        z-index: 999;
      }

      .incoming-call-modal {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        min-width: 300px;
      }

      .content {
        text-align: center;
      }

      h2 {
        margin: 0 0 16px;
        color: #333;
      }

      .caller-info {
        margin-bottom: 24px;
      }

      .caller-name {
        font-size: 18px;
        margin: 0 0 8px;
        font-weight: 500;
      }

      .caller-number {
        font-size: 14px;
        margin: 0;
        color: #666;
      }

      .button-container {
        display: flex;
        justify-content: center;
        gap: 24px;
      }

      button {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s;
      }

      button:hover {
        transform: scale(1.1);
      }

      button svg {
        width: 24px;
        height: 24px;
      }

      .accept {
        background: #4CAF50;
        color: white;
      }

      .decline {
        background: #f44336;
        color: white;
      }
    `;

    this.shadow.appendChild(style);
    this.shadow.appendChild(overlay);
    this.shadow.appendChild(container);

    return new Promise<"accept" | "decline">((resolve) => {
      acceptButton.addEventListener("click", () => resolve("accept"));
      declineButton.addEventListener("click", () => resolve("decline"));
    });
  }
}

customElements.define("incoming-call-modal", IncomingCallModal);

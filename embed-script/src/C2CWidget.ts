import modal from "./ui/modal.ui.ts";
import loadingUI from "./ui/loading.html.ts";
import { Call, UserVariables } from "./Call.ts";

import devices from "./Devices.ts";
import createControls from "./ui/controls.ui.ts";
import { ChatEntry } from "./Chat.ts";
import createChatUI from "./ui/chat.ui.ts";
import { style } from "./Style.ts";
import errorModal from "./ui/errorModal.ui.ts";
import surveyModal from "./ui/surveyModal.ui.ts";
import { FabricRoomSession } from "@signalwire/js";
import { createUserForm } from "./ui/userForm.ui";

export interface CallDetails {
  destination: string;
  supportsAudio: boolean;
  supportsVideo: boolean;
}

export default class C2CWidget extends HTMLElement {
  callOngoing: boolean = false;
  callLoading: boolean = false;
  callStarted: boolean = false;
  shadow = this.attachShadow({ mode: "open" });
  callDetails: CallDetails | null = null;
  call: Call | null = null;
  containerElement: HTMLElement | null = null;
  modalContainer: HTMLElement | null = null;
  previousOverflowStyle: string = "";
  token: string | null = null;
  userVariables: UserVariables | null = null;

  static get observedAttributes() {
    return ["token", "buttonid", "calldetails", "uservariables"];
  }

  constructor() {
    super();
    this.setupDOM();
    style.apply(this.shadow);
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    switch (name) {
      case "token":
        this.token = newValue;
        break;
      case "calldetails":
        try {
          this.callDetails = JSON.parse(newValue) as CallDetails;
        } catch (e) {
          console.error("Invalid JSON in callDetails attribute");
          this.callDetails = null;
        }
        break;
      case "uservariables":
        try {
          const newUserVariables = JSON.parse(newValue) as UserVariables;
          this.userVariables = newUserVariables;
          if (this.call) {
            this.call.addUserVariables(newUserVariables);
          }
        } catch (e) {
          console.error("Invalid JSON in userVariables attribute");
          this.userVariables = null;
        }
        break;
    }
  }

  connectedCallback() {
    const token = this.getAttribute("token");
    this.token = token;
    const buttonId = this.getAttribute("buttonId");
    if (buttonId) {
      const setupButton = (button: HTMLElement) => {
        if (button.classList.contains("demo-button-disabled")) {
          button.classList.remove("demo-button-disabled");
        }
        button.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.setupCall();
        });
      };

      const button = document.getElementById(buttonId);
      if (button) {
        setupButton(button);
      } else {
        // the button might be injected AFTER the widget is connected
        // so we need to watch for it
        const observer = new MutationObserver((_mutations, obs) => {
          const button = document.getElementById(buttonId);
          if (button) {
            setupButton(button);
            obs.disconnect();
          }
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true,
        });
      }
    }

    try {
      const callDetails = this.getAttribute("callDetails");
      if (callDetails === null) {
        throw new Error("callDetails attribute is required");
      }
      this.callDetails = JSON.parse(callDetails) as CallDetails;
    } catch (e) {
      console.error("Invalid JSON in callDetails attribute");
      this.callDetails = null;
    }

    try {
      const userVariables = this.getAttribute("userVariables");
      if (userVariables) {
        this.userVariables = JSON.parse(userVariables) as UserVariables;
      }
    } catch (e) {
      console.error("Invalid JSON in userVariables attribute");
      this.userVariables = null;
    }

    if (this.callDetails && this.token) {
      this.call = new Call(this.callDetails, this.token);
      if (this.userVariables) {
        this.call.addUserVariables(this.userVariables);
      }
    }
  }

  private closeModal(showSurvey: boolean = true) {
    if (this.modalContainer) {
      if (showSurvey && this.callStarted) {
        const surveyAttr = this.getAttribute("survey");
        if (surveyAttr) {
          try {
            const surveyParams = JSON.parse(surveyAttr);
            const surveyModalUI = surveyModal(surveyParams, () => {
              this.finalizeClose();
            });
            if (surveyModalUI) {
              this.modalContainer.appendChild(surveyModalUI);
              return;
            }
          } catch (e) {
            console.error("Invalid JSON in survey attribute");
          }
        }
      }
      this.finalizeClose();
    }
  }

  private finalizeClose() {
    if (this.modalContainer) {
      const modal = this.modalContainer.querySelector(".modal");
      this.modalContainer.classList.add("closing");
      modal?.classList.add("closing");

      setTimeout(() => {
        devices.reset();
        this.modalContainer?.remove();
        this.modalContainer = null;
        document.body.style.overflow = this.previousOverflowStyle;
        this.callOngoing = false;
        this.callStarted = false;
        this.call?.reset();
      }, 800);
    }
  }

  async setupCall() {
    if (this.callOngoing) {
      console.warn("Call is already ongoing; nop");
      return;
    } else if (this.callDetails === null || this.call === null) {
      console.warn("No call or Call details provided");
      return;
    }

    const beforeCallEvent = new CustomEvent("beforecall", {
      cancelable: true,
      bubbles: true,
    });

    const eventResult = this.dispatchEvent(beforeCallEvent);
    if (!eventResult) {
      console.log("Call cancelled by beforecall event handler");
      return;
    }

    this.callOngoing = true;
    this.callLoading = true;

    this.previousOverflowStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const {
      modalContainer,
      videoPanel,
      videoArea,
      localVideoArea,
      controlsPanel,
      chatPanel,
    } = modal();

    this.modalContainer = modalContainer;
    this.containerElement?.appendChild(modalContainer);

    const collectUserDetails =
      this.getAttribute("collectUserDetails") !== "false";

    const startCall = async (userVariables?: UserVariables) => {
      if (userVariables) {
        this.call?.addUserVariables(userVariables);
      }

      this.renderLoading(this.callLoading, videoPanel);

      const permissionResult = await devices.getPermissions(
        this.callDetails?.supportsVideo ?? false
      );
      if (!permissionResult.success) {
        console.error("Error getting permissions");
        const errorModalUI = errorModal(
          "Error Accessing Devices",
          permissionResult.message ||
            "Error getting device permissions. Please grant this page access and try again.",
          () => this.closeModal()
        );
        this.modalContainer?.appendChild(errorModalUI);
        return;
      }

      let callInstance: FabricRoomSession | null = null;

      try {
        callInstance =
          (await this.call?.dial(
            videoArea,
            function (chatHistory: ChatEntry[]) {
              createChatUI(chatHistory, chatPanel);
            },
            function (localVideo: HTMLElement) {
              localVideoArea.appendChild(localVideo);
            }
          )) ?? null;
      } catch (e) {
        console.error("Error setting up call", e);
        const errorModalUI = errorModal(
          "Error",
          "Error creating the call. Please refresh the page and try again.",
          () => this.closeModal(false)
        );
        this.modalContainer?.appendChild(errorModalUI);
        return;
      }

      if (callInstance) {
        await devices.setup(callInstance);
      }

      devices.onAspectRatioChange = (aspectRatio: number | null) => {
        if (aspectRatio && localVideoArea) {
          localVideoArea.style.aspectRatio = `${aspectRatio}`;
        }
      };

      const control = await createControls(async () => {
        try {
          await this.call?.hangup();
        } catch (e) {
          console.error("Error hanging up call. Force terminating call.", e);
        }
        this.closeModal();
      });

      callInstance?.on("room.left", () => {
        this.closeModal(true);
      });

      callInstance?.on("destroy", () => {
        this.closeModal(true);
      });

      controlsPanel.appendChild(control);

      try {
        await this.call?.start();
        this.callStarted = true;
      } catch (e) {
        console.error("Error starting call", e);
        const errorModalUI = errorModal(
          "Error",
          "Error starting the call. This is possibly due to network issues. Please refresh the page and try again.",
          () => this.closeModal(false)
        );
        this.modalContainer?.appendChild(errorModalUI);
        return;
      }

      this.callLoading = false;
      this.renderLoading(this.callLoading, videoPanel);
    };

    if (collectUserDetails) {
      const form = createUserForm({
        onSubmit: (variables) => {
          startCall(variables);
        },
        onClose: () => {
          this.closeModal(false);
        },
      });
      videoArea.appendChild(form.userFormContainer);
    } else {
      await startCall();
    }
  }

  renderLoading(loadingState: boolean, element: HTMLElement) {
    if (loadingState) {
      const { loading } = loadingUI();
      element.appendChild(loading);
    } else {
      element.querySelector(".loading")?.remove();
    }
  }

  setupDOM() {
    const container = document.createElement("div");
    this.shadow.appendChild(container);
    this.containerElement = container;
  }

  disconnectedCallback() {
    this.closeModal(false);
  }
}

customElements.define("c2c-widget", C2CWidget);

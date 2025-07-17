import videoTranscriptModal from "../../ui/modal.ui.ts";
import { Call, UserVariables } from "./Call.ts";

import devices from "../../Devices.ts";
import createControls from "../../ui/controls.ui.ts";
import { ChatEntry } from "./Chat.ts";
import createChatUI from "../../ui/chat.ui.ts";
import { style } from "../../Style.ts";
import { FabricRoomSession } from "@signalwire/js";
import { ButtonObserver } from "./ButtonObserver.ts";
import { CallWidgetConfig } from "./CallWidgetConfig.ts";
import { LoadingManager } from "./LoadingManager.ts";
import { CallInfoModal } from "../call-info-modal/CallInfoModal.ts";
import { IncomingCallModal } from "../incoming-call-modal/IncomingCallModal.ts";
import html from "../../lib/html.ts";

export default class CallWidget extends HTMLElement {
  callOngoing: boolean = false;
  shadow = this.attachShadow({ mode: "open" });
  callManager: Call | null = null;

  containerElement: HTMLElement | null = null;
  modalContainer: HTMLElement | null = null;
  previousOverflowStyle: string = "";
  token: string | null = null;
  userVariables: UserVariables | null = null;
  private buttonObserver: ButtonObserver | null = null;
  private config: CallWidgetConfig;
  private loadingManager: LoadingManager | null = null;
  private activeInfoModal: CallInfoModal | null = null;

  static get observedAttributes() {
    return ["token", "button-id"];
  }

  constructor() {
    super();
    const container = document.createElement("div");
    this.shadow.appendChild(container);
    this.containerElement = container;
    style.apply(this.shadow);
    this.config = new CallWidgetConfig(this);
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    if (name === "button-id") {
      this.buttonObserver?.destroy();
      this.buttonObserver = new ButtonObserver(newValue, () =>
        this.setupCall()
      );
    }
    if (name === "token") {
      (async () => {
        await this.callManager?.destroy();
        this.callManager = new Call({
          config: this.config,
          widget: this,
        });
      })();
    }
  }

  connectedCallback() {
    this.addEventListener("call.incoming", async (event: any) => {
      await this.setupCallFromNotification(event.detail);
    });
  }

  private closeModal() {
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
        this.callManager?.reset();
      }, 800);
    }
  }

  private async showError(title: string, message: string) {
    const infoModal = new CallInfoModal();
    this.activeInfoModal = infoModal;
    this.modalContainer?.appendChild(infoModal);
    await infoModal.show(title, message);
    this.activeInfoModal = null;
    infoModal.remove();
  }

  async setupCall() {
    if (this.callOngoing) {
      console.warn("Call is already ongoing; nop");
      return;
    } else if (this.callManager === null) {
      console.warn("CallManager Object is not initialized");
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
    this.loadingManager?.setLoading(true);

    this.previousOverflowStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const windowMode = this.config.getWindowMode();
    console.log("windowMode", windowMode);

    let {
      modalContainer,
      videoPanel,
      videoArea,
      localVideoArea,
      controlsPanel,
      chatPanel,
    } = videoTranscriptModal({
      backgroundImage: this.config.getBackgroundImage(),
      backgroundThumbnail: this.config.getBackgroundThumbnail(),
    });

    const modal = modalContainer.querySelector(".modal");

    if (windowMode === "video") {
      modal?.classList.add("video-mode");
      chatPanel.style.display = "none";
    } else if (windowMode === "video+transcript" || windowMode === null) {
      // videoPanel.style.display = "none";
      // localVideoArea.style.display = "none";
    } else if (windowMode === "audio+transcript") {
      modal?.classList.add("audio-transcript-mode");
    }

    this.modalContainer = modalContainer;
    this.containerElement?.appendChild(modalContainer!);
    this.loadingManager = new LoadingManager(videoPanel!);

    this.loadingManager?.setLoading(true);

    const supportsVideo = this.config.getSupportVideo();

    const permissionResult = await devices.getPermissions(
      supportsVideo ?? false
    );
    if (!permissionResult.success) {
      console.error("Error getting permissions");
      await this.showError(
        "Error Accessing Devices",
        permissionResult.message ||
          "Error getting device permissions. Please grant this page access and try again."
      );
      this.closeModal();
      return;
    }

    let callInstance: FabricRoomSession | null = null;

    try {
      callInstance =
        (await this.callManager?.dial(
          videoArea ?? undefined,
          function (chatHistory: ChatEntry[]) {
            if (chatPanel) {
              createChatUI(chatHistory, chatPanel);
            }
          },
          function (localVideo: HTMLElement) {
            if (localVideoArea) {
              localVideoArea.appendChild(localVideo);
            }
          }
        )) ?? null;
    } catch (e) {
      console.error("Error setting up call", e);
      await this.showError(
        "Error",
        "Error creating the call. Please refresh the page and try again."
      );
      this.closeModal();
      return;
    }

    if (!callInstance) {
      this.closeModal();
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

    const control = await createControls(
      async () => {
        try {
          await this.callManager?.hangup();
        } catch (e) {
          console.error("Error hanging up call. Force terminating call.", e);
        }
        this.closeModal();
      },
      {
        supportsVideo: this.config.getSupportVideo() ?? false,
        supportsAudio: this.config.getSupportAudio() ?? false,
      }
    );

    callInstance?.on("destroy", async () => {
      if (this.activeInfoModal) {
        // Wait for the info modal to be dismissed before closing
        const observer = new MutationObserver(() => {
          if (!this.activeInfoModal) {
            observer.disconnect();
            this.closeModal();
          }
        });

        observer.observe(this.modalContainer!, {
          childList: true,
          subtree: true,
        });
      } else {
        this.closeModal();
      }
    });

    if (controlsPanel) {
      controlsPanel.appendChild(control);
    }

    try {
      await this.callManager?.start();
      this.callOngoing = true;
    } catch (e) {
      console.error("Error starting call", e);
      await this.showError(
        "Error",
        "Error starting the call. This is possibly due to network issues. Please refresh the page and try again."
      );
      this.closeModal();
      return;
    }

    this.loadingManager?.setLoading(false);
  }

  async setupCallFromNotification(eventDetails: any) {
    if (this.callOngoing) {
      try {
        await this.callManager?.destroy();
      } catch (e) {
        console.error("Error destroying call", e);
      }
      return;
    }

    let callReceivePromptAnswer: "accept" | "decline" | null = null;

    if (this.config.getAutoAnswer()) {
      callReceivePromptAnswer = "accept";
      // callInstance = await eventDetails.accept({ rootElement: videoArea });
    } else {
      const incomingCallModal = new IncomingCallModal();
      this.containerElement?.appendChild(incomingCallModal);

      callReceivePromptAnswer = await incomingCallModal.show(
        eventDetails.caller.name,
        eventDetails.caller.number
      );
      incomingCallModal.remove();
    }

    this.callOngoing = true;
    this.loadingManager?.setLoading(true);

    this.previousOverflowStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    let {
      modalContainer,
      videoPanel,
      videoArea,
      localVideoArea,
      controlsPanel,
      chatPanel: _,
    } = videoTranscriptModal({
      backgroundImage: this.config.getBackgroundImage(),
      backgroundThumbnail: this.config.getBackgroundThumbnail(),
    });

    this.modalContainer = modalContainer;
    this.containerElement?.appendChild(modalContainer);
    this.loadingManager = new LoadingManager(videoPanel);

    this.loadingManager?.setLoading(true);

    const supportsVideo = this.config.getSupportVideo();

    const permissionResult = await devices.getPermissions(
      supportsVideo ?? false
    );
    if (!permissionResult.success) {
      console.error("Error getting permissions");
      await this.showError(
        "Error Accessing Devices",
        permissionResult.message ||
          "Error getting device permissions. Please grant this page access and try again."
      );
      this.closeModal();
      return;
    }

    let callInstance: FabricRoomSession | null = null;

    if (callReceivePromptAnswer === "accept") {
      callInstance = await eventDetails.accept({ rootElement: videoArea });
    } else {
      await eventDetails.reject();
    }

    callInstance?.on("call.joined", () => {
      console.log("Call joined from Notification");
    });
    callInstance?.on("room.joined", () => {
      console.log("Room joined from Notification");
    });

    callInstance?.on("room.joined", () => {
      console.log("Call Joined from Notification");
      const callStartedEvent = new CustomEvent("call.joined", {
        detail: {
          call: callInstance,
          fromNotification: true,
        },
        bubbles: true,
      });
      this.dispatchEvent(callStartedEvent);
      // @ts-ignore
      window.call = callInstance;
      if (callInstance?.localStream) {
        devices.updateVideoAspectRatio();
        const { localVideo } = html`<video
          autoplay
          playsinline
          muted
          name="localVideo"
        ></video>`();

        (localVideo as HTMLVideoElement).onloadedmetadata = () => {
          devices.onAspectRatioChange(
            (localVideo as HTMLVideoElement).videoWidth /
              (localVideo as HTMLVideoElement).videoHeight
          );
        };

        (localVideo as HTMLVideoElement).srcObject = callInstance.localStream;
        localVideoArea.appendChild(localVideo);
      }
    });

    if (callInstance) {
      await devices.setup(callInstance);
    }

    devices.onAspectRatioChange = (aspectRatio: number | null) => {
      if (aspectRatio && localVideoArea) {
        localVideoArea.style.aspectRatio = `${aspectRatio}`;
      }
    };

    const control = await createControls(
      async () => {
        try {
          await callInstance?.hangup();
        } catch (e) {
          console.error("Error hanging up call. Force terminating call.", e);
        }
        this.closeModal();
      },
      {
        supportsVideo: this.config.getSupportVideo() ?? false,
        supportsAudio: this.config.getSupportAudio() ?? false,
      }
    );

    callInstance?.on("destroy", async () => {
      if (this.activeInfoModal) {
        // Wait for the info modal to be dismissed before closing
        const observer = new MutationObserver(() => {
          if (!this.activeInfoModal) {
            observer.disconnect();
            this.closeModal();
          }
        });

        observer.observe(this.modalContainer!, {
          childList: true,
          subtree: true,
        });
      } else {
        this.closeModal();
      }
    });

    controlsPanel.appendChild(control);

    this.loadingManager?.setLoading(false);
  }

  disconnectedCallback() {
    this.buttonObserver?.disconnectObserver();
    this.closeModal();
  }
}

customElements.define("call-widget", CallWidget);

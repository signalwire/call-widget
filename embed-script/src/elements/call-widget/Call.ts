import {
  FabricRoomSession,
  SignalWire,
  SignalWireClient,
} from "@signalwire/js";
import { Chat, ChatEntry } from "./Chat";
import html from "../../lib/html";
import devices from "../../Devices";
import { CallWidgetConfig } from "./CallWidgetConfig";
import { CallParams } from "@signalwire/js/dist/js/src/fabric/interfaces";

export interface UserVariables {
  userName: string;
  userEmail: string;
  userPhone: string;
}

export class Call {
  private client: SignalWireClient | null = null;
  private clientInitPromise: Promise<SignalWireClient> | null = null;
  config: CallWidgetConfig | null = null;

  // to dispatch events
  private widget: HTMLElement;

  chat: Chat | null = null;
  currentCall: FabricRoomSession | null = null;

  constructor({
    config,
    widget,
  }: {
    config: CallWidgetConfig | null;
    widget: HTMLElement;
  }) {
    this.widget = widget;
    if (config) {
      this.config = config;
      this.clientInitPromise = this.setupClient(config);
    } else {
      throw new Error("Config is not set");
    }

    const handleUnload = () => {
      if (this.currentCall) {
        this.currentCall.hangup();
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("unload", handleUnload);
  }

  private async getWidgetToken(embedsToken: string) {
    const response = await fetch(
      "https://embeds.signalwire.com/api/fabric/embeds/tokens",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: embedsToken }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to authenticate embeds token");
    }

    const data = await response.json();
    return data.token;
  }

  getLocalVideoTrack() {
    return this.currentCall?.localVideoTrack;
  }

  getLocalAudioTrack() {
    return this.currentCall?.localAudioTrack;
  }

  private async setupClient(config: CallWidgetConfig) {
    const token = config.getToken();
    if (!token) {
      throw new Error("Token is not set");
    }

    let clientToken = token;
    if (token.startsWith("c2c_")) {
      clientToken = await this.getWidgetToken(token);
    }

    const logLevel = config.getDebugMode();
    const logWsTraffic = config.getDebugWsTraffic();

    // Remove all SAT keys from session storage before dial
    // github.com/signalwire/call-widget/issues/8
    ["ci-SAT", "pt-SAT", "as-SAT"].forEach((key) =>
      sessionStorage.removeItem(key)
    );

    const client = await SignalWire({
      token: clientToken,
      host: config.getHost() ?? undefined,
      logLevel: logLevel ?? undefined,
      debug: logWsTraffic ? { logWsTraffic } : undefined,
    });

    // @ts-ignore
    client.on("ai.partial_result", (params) => {
      // AI partial result (typing indicator)
      this.chat?.handleEvent(
        "ai.partial_result",
        params.text ?? "",
        params.barged ?? false
      );
    });

    // @ts-ignore
    client.on("ai.speech_detect", (params) => {
      // AI speech detection (user speaking)
      const cleanText = params.text.replace(/\{confidence=[\d.]+\}/, "");
      this.chat?.handleEvent(
        "ai.speech_detect",
        cleanText,
        params.type !== "normal" // this also doesn't seem to have type=barged, but leaving here for now
      );
    });

    // @ts-ignore
    client.on("ai.transparent_barge", (params) => {
      // AI transparent barge (remove last AI speech)
      console.log("ai.transparent_barge", params);
      const cleanText = params.combined_text;
      this.chat?.handleEvent("ai.transparent_barge", cleanText, true);
    });

    // @ts-ignore
    client.on("ai.completion", (params) => {
      // AI completion (final response)
      this.chat?.handleEvent(
        "ai.completion",
        params.text ?? "",
        params.type === "barged"
      );
    });

    // @ts-ignore
    client.on("ai.response_utterance", (params) => {
      // AI response utterance (spoken response)
      this.chat?.handleEvent(
        "ai.response_utterance",
        params.utterance ?? "",
        false // this doesn't have barged yet
      );
    });

    // @ts-ignore
    client.on("calling.user_event", (params) => {
      console.log("calling.user_event", params);
      const userEvent = new CustomEvent("calling.user_event", {
        detail: params,
        bubbles: true,
      });
      this.widget.dispatchEvent(userEvent);
    });

    if (config.getReceiveCalls()) {
      client.online({
        incomingCallHandlers: {
          websocket: (callInvite) => {
            console.log("incoming call", callInvite);
            const incomingCallEvent = new CustomEvent("call.incoming", {
              detail: {
                callInvite,
                caller: {
                  name: callInvite.invite.details?.caller_id_name,
                  number: callInvite.invite.details?.caller_id_number,
                },
                accept: async (params: CallParams) => {
                  const roomSession = await callInvite.invite.accept(params);
                  this.currentCall = roomSession;
                  return roomSession;
                },
                reject: () => callInvite.invite.reject(),
              },
              bubbles: true,
            });
            this.widget.dispatchEvent(incomingCallEvent);
          },
        },
      });
    }

    this.client = client;
    return client;
  }

  async dial(
    container: HTMLElement | undefined,
    onChatChange: (chatHistory: ChatEntry[]) => void,
    onLocalVideo: (localVideo: HTMLVideoElement) => void
  ) {
    if (!this.client && this.clientInitPromise) {
      await this.clientInitPromise;
    }

    const beforeDialApproved = await new Promise<boolean>((resolve) => {
      const beforeDialEvent = new CustomEvent("beforeDial", {
        detail: {
          hasListeners: false,
          approve: () => resolve(true),
          reject: () => resolve(false),
        },
        bubbles: true,
      });

      this.widget.dispatchEvent(beforeDialEvent);

      // If no one flagged that they're listening, proceed immediately
      if (!beforeDialEvent.detail.hasListeners) {
        resolve(true);
      }
    });

    if (!beforeDialApproved) {
      await this.destroy();
      return null;
    }

    console.log(this.client);

    if (!this.client) {
      throw new Error("Client is not initialized");
    }

    this.chat = new Chat();
    this.chat.onUpdate = () => {
      onChatChange(this.chat?.getHistory() ?? []);
    };
    this.chat.onUpdate();

    const userVariables = this.config?.getUserVariables();
    const destination = this.config?.getDestination();
    const supportsAudio = this.config?.getSupportAudio();
    const supportsVideo = this.config?.getSupportVideo();

    if (!destination) {
      throw new Error("Destination is not set");
    }

    const finalUserVariables = {
      callOriginHref: window.location.href,
      ...userVariables,
    };

    // Add user variables to the room session
    const roomSession = await this.client.dial({
      to: destination,
      rootElement: container ?? undefined,
      audio: supportsAudio ?? undefined,
      video: supportsVideo ?? undefined,
      negotiateVideo: supportsVideo ?? undefined,
      userVariables: finalUserVariables,
    });
    this.currentCall = roomSession;

    console.info(
      "Call started",
      this.currentCall,
      "with user variables",
      finalUserVariables
    );

    roomSession.on("call.joined", () => {
      const callStartedEvent = new CustomEvent("call.joined", {
        detail: {
          call: this.currentCall,
          client: this.client,
        },
        bubbles: true,
      });
      this.widget.dispatchEvent(callStartedEvent);
      // @ts-ignore
      window.call = roomSession;
      if (roomSession?.localStream) {
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

        (localVideo as HTMLVideoElement).srcObject = roomSession.localStream;
        onLocalVideo(localVideo as HTMLVideoElement);
      }
    });

    roomSession.on("call.left", () => {
      const callEndedEvent = new CustomEvent("call.left", {
        detail: {
          call: this.currentCall,
        },
        bubbles: true,
      });
      this.widget.dispatchEvent(callEndedEvent);
    });

    roomSession.on("destroy", () => {
      const callEndedEvent = new CustomEvent("destroy", {
        detail: {
          call: this.currentCall,
        },
        bubbles: true,
      });
      this.widget.dispatchEvent(callEndedEvent);
    });

    return roomSession;
  }

  async start() {
    if (!this.client) {
      throw new Error("Client is not set");
    }
    await this.currentCall?.start();
  }

  async hangup() {
    if (!this.currentCall) {
      throw new Error("Call is not set");
    }
    await this.currentCall?.hangup();
  }

  async destroy() {
    if (this.currentCall) {
      await this.currentCall.hangup();
    }

    if (this.client) {
      // @ts-ignore
      this.client.off("ai.partial_result");
      // @ts-ignore
      this.client.off("ai.speech_detect");
      // @ts-ignore
      this.client.off("ai.completion");
      // @ts-ignore
      this.client.off("ai.response_utterance");
      // @ts-ignore

      this.client.disconnect();
      this.client = null;
    }

    this.currentCall = null;
    this.chat = null;
  }

  reset() {
    if (this.client) {
      // @ts-ignore
      this.client.off("ai.partial_result");
      // @ts-ignore
      this.client.off("ai.speech_detect");
      // @ts-ignore
      this.client.off("ai.completion");
      // @ts-ignore
      this.client.off("ai.response_utterance");
    }
    this.currentCall?.hangup();
    this.currentCall = null;
    this.chat = new Chat();
  }
}

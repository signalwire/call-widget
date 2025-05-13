import {
  FabricRoomSession,
  SignalWire,
  SignalWireClient,
  SignalWireClientParams,
} from "@signalwire/js";
import { Chat, ChatEntry } from "./Chat";
import html from "../../lib/html";
import devices from "../../Devices";

export interface UserVariables {
  userName: string;
  userEmail: string;
  userPhone: string;
}

export class Call {
  private client: SignalWireClient | null = null;
  private clientInitPromise: Promise<SignalWireClient> | null = null;

  // to dispatch events
  private widget: HTMLElement;

  chat: Chat | null = null;
  currentCall: FabricRoomSession | null = null;

  constructor({
    token,
    widget,
  }: {
    token: string | null;
    widget: HTMLElement;
  }) {
    this.widget = widget;
    if (token) {
      this.clientInitPromise = this.setupClient(token);
    }
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

  private async setupClient(
    token: string | null,
    logWsTraffic?: boolean,
    logLevel?: SignalWireClientParams["logLevel"]
  ) {
    if (!token) {
      throw new Error("Token is not set");
    }

    let clientToken = token;
    if (token.startsWith("c2c_")) {
      clientToken = await this.getWidgetToken(token);
    }

    // Remove all SAT keys from session storage before dial
    // github.com/signalwire/call-widget/issues/8
    ["ci-SAT", "pt-SAT", "as-SAT"].forEach((key) =>
      sessionStorage.removeItem(key)
    );

    const client = await SignalWire({
      token: clientToken,
      incomingCallHandlers: {
        websocket: (callInvite) => {
          console.log("incoming call", callInvite);
        },
      },
      logLevel: logLevel,
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

    this.client = client;
    return client;
  }

  async dial(
    container: HTMLElement,
    onChatChange: (chatHistory: ChatEntry[]) => void,
    onLocalVideo: (localVideo: HTMLVideoElement) => void,
    userVariables: { [key: string]: string },
    destination: string,
    supportsAudio: boolean,
    supportsVideo: boolean
  ) {
    if (!this.client && this.clientInitPromise) {
      await this.clientInitPromise;
    }

    console.log(this.client);

    if (!this.client) {
      throw new Error("Client is not initialized");
    }

    this.chat = new Chat();

    const finalUserVariables = {
      callOriginHref: window.location.href,
      ...userVariables,
    };

    // Add user variables to the room session
    const roomSession = await this.client.dial({
      to: destination,
      rootElement: container,
      audio: supportsAudio,
      video: supportsVideo,
      negotiateVideo: supportsVideo,
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

    roomSession.on("call.updated", () => {
      // we want to track mute states
      // what does the server know about the client's mute states?
      // we ofc also have a local state
      console.log("call.updated", roomSession);
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

    if (this.chat) {
      this.chat.onUpdate = () => {
        onChatChange(this.chat?.getHistory() ?? []);
      };
    }

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

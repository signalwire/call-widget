import {
  FabricRoomSession,
  SignalWire,
  SignalWireClient,
} from "@signalwire/js";
import { CallDetails } from "./C2CWidget";
import { Chat, ChatEntry } from "./Chat";
import html from "./lib/html";
import devices from "./Devices";
export class Call {
  private client: SignalWireClient | null = null;
  private callDetails: CallDetails | null = null;
  chat: Chat | null = null;
  currentCall: FabricRoomSession | null = null;
  token: string | null = null;

  constructor(callDetails: CallDetails, token: string) {
    this.callDetails = callDetails;
    this.token = token;
  }

  getLocalVideoTrack() {
    return this.currentCall?.localVideoTrack;
  }

  getLocalAudioTrack() {
    return this.currentCall?.localAudioTrack;
  }

  async setupClient() {
    if (!this.token) {
      throw new Error("Token is not set");
    }
    const client = await SignalWire({
      token: this.token,
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
    onLocalVideo: (localVideo: HTMLVideoElement) => void
  ) {
    const client = await this.setupClient();
    this.chat = new Chat();

    if (!this.callDetails) {
      throw new Error("Call details are not set");
    }

    const currentCallLocal = await client.dial({
      to: this.callDetails.destination,
      rootElement: container,
      audio: this.callDetails.supportsAudio,
      video: this.callDetails.supportsVideo,
      negotiateVideo: this.callDetails.supportsVideo,
    });
    this.currentCall = currentCallLocal;

    currentCallLocal.on("call.joined", () => {
      console.log("call.joined", currentCallLocal);
      // @ts-ignore
      window.call = currentCallLocal;
      if (currentCallLocal?.localStream) {
        devices.updateVideoAspectRatio();
        console.log(currentCallLocal.localStream);
        const { localVideo } = html`<video
          autoplay
          playsinline
          muted
          name="localVideo"
        ></video>`();

        (localVideo as HTMLVideoElement).onloadedmetadata = () => {
          console.log(
            "localVideo.onloadedmetadata",
            (localVideo as HTMLVideoElement).videoWidth /
              (localVideo as HTMLVideoElement).videoHeight
          );

          devices.onAspectRatioChange(
            (localVideo as HTMLVideoElement).videoWidth /
              (localVideo as HTMLVideoElement).videoHeight
          );
        };

        (localVideo as HTMLVideoElement).srcObject =
          currentCallLocal.localStream;
        onLocalVideo(localVideo as HTMLVideoElement);
      }
    });

    currentCallLocal.on("call.updated", () => {
      // we want to track mute states
      // what does the server know about the client's mute states?
      // we ofc also have a local state
      console.log("call.updated", currentCallLocal);
    });

    if (this.chat) {
      this.chat.onUpdate = () => {
        onChatChange(this.chat?.getHistory() ?? []);
      };
    }

    return currentCallLocal;
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

      this.client.disconnect();
    }
    this.currentCall = null;
    this.client = null;
    this.chat = null;
  }
}

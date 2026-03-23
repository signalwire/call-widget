import {
  SignalWire,
  StaticCredentialProvider,
  type Call as SWCall,
} from "@signalwire/js";
import { Chat, ChatEntry } from "./Chat";
import html from "../../lib/html";
import devices from "../../Devices";
import { CallWidgetConfig } from "./CallWidgetConfig";

export interface UserVariables {
  userName: string;
  userEmail: string;
  userPhone: string;
}

export class Call {
  private client: InstanceType<typeof SignalWire> | null = null;
  private clientInitPromise: Promise<InstanceType<typeof SignalWire>> | null =
    null;
  config: CallWidgetConfig | null = null;

  // to dispatch events
  private widget: HTMLElement;

  chat: Chat | null = null;
  currentCall: SWCall | null = null;
  private subscriptions: { unsubscribe: () => void }[] = [];

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
      },
    );

    if (!response.ok) {
      throw new Error("Failed to authenticate embeds token");
    }

    const data = await response.json();
    return data.token;
  }

  private async setupClient(config: CallWidgetConfig) {
    const token = config.getToken();
    if (!token) {
      throw new Error("Token is not set");
    }

    let clientToken = token;
    if (token.startsWith("c2c_") || token.startsWith("c2t_")) {
      clientToken = await this.getWidgetToken(token);
    }

    // Remove all SAT keys from session storage before dial
    // github.com/signalwire/call-widget/issues/8
    ["ci-SAT", "pt-SAT", "as-SAT"].forEach((key) =>
      sessionStorage.removeItem(key),
    );

    const client = new SignalWire(
      new StaticCredentialProvider({ token: clientToken }),
    );

    // @ts-ignore
    client.on?.("user_event", (params: any) => {
      console.log("user_event", params);
      const userEvent = new CustomEvent("user_event", {
        detail: params,
        bubbles: true,
      });
      this.widget.dispatchEvent(userEvent);
    });

    if (config.getReceiveCalls()) {
      const incomingSub = client.session.incomingCalls$.subscribe(
        (incomingCalls: SWCall[]) => {
          const ringingCall = incomingCalls.find(
            (c: any) => c.status === "ringing",
          );
          if (ringingCall) {
            const incomingCallEvent = new CustomEvent("call.incoming", {
              detail: {
                call: ringingCall,
                caller: {
                  name: (ringingCall as any).address?.displayName,
                  number: (ringingCall as any).address?.id,
                },
                accept: async (params: any) => {
                  ringingCall.answer(params); // answer() is synchronous in v4
                  this.currentCall = ringingCall;
                  return ringingCall;
                },
                reject: () => ringingCall.reject(), // reject() is synchronous in v4
              },
              bubbles: true,
            });
            this.widget.dispatchEvent(incomingCallEvent);
          }
        },
      );
      this.subscriptions.push(incomingSub);
    }

    this.client = client;
    return client;
  }

  private waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client) {
        reject(new Error("Client is not initialized"));
        return;
      }
      let done = false;
      const sub = this.client.isConnected$.subscribe((connected: boolean) => {
        if (connected && !done) {
          done = true;
          resolve();
        }
      });
      if (done) sub.unsubscribe();
    });
  }

  async dial(
    container: HTMLElement | undefined,
    onChatChange: (chatHistory: ChatEntry[]) => void,
    onLocalVideo: (localVideo: HTMLVideoElement) => void,
    destination?: string,
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

      if (!beforeDialEvent.detail.hasListeners) {
        resolve(true);
      }
    });

    if (!beforeDialApproved) {
      return null;
    }

    if (!this.client) {
      throw new Error("Client is not initialized");
    }

    await this.waitForConnection();

    this.chat = new Chat();
    this.chat.onUpdate = () => {
      onChatChange(this.chat?.getHistory() ?? []);
    };
    this.chat.onUpdate();

    const userVariables = this.config?.getUserVariables();
    const finalDestination = destination || this.config?.getDestination();
    const supportsAudio = this.config?.getSupportAudio();
    const supportsVideo = this.config?.getSupportVideo();

    if (!finalDestination) {
      throw new Error("Destination is not set");
    }

    const finalUserVariables = {
      callOriginHref: window.location.href,
      ...userVariables,
    };

    // Audio constraints passed via inputAudioDeviceConstraints
    const audioConstraints: MediaTrackConstraints = {
      autoGainControl: devices.state.autoGainControl,
      noiseSuppression: devices.state.noiseSuppression,
      echoCancellation: true, // Always keep echo cancellation on
    };

    const call = await this.client.dial(finalDestination, {
      audio: supportsAudio ?? false,
      video: supportsVideo ?? false,
      receiveAudio: supportsAudio ?? false,
      receiveVideo: supportsVideo ?? false,
      inputAudioDeviceConstraints: supportsAudio ? audioConstraints : undefined,
    });

    // Set user variables after dial (v4 API)
    call.userVariables = finalUserVariables;

    this.currentCall = call;

    console.info(
      "Call started",
      this.currentCall,
      "with user variables",
      finalUserVariables,
    );

    // Subscribe to AI events via the session-level stream.
    // call.signalingEvent$ is derived from call.callEvent$ which filters out ai.* events.
    // The raw session stream includes all events; we filter to this call by call_id/room_session_id.
    const callId = call.id;
    const signalingEventSub = (this.client as any).session.signalingEvent$.subscribe((event: any) => {
      const p = event?.params ?? {};
      if (p.call_id !== callId && p.room_session_id !== callId) return;

      const eventType: string = event.event_type ?? "";
      const params = p;

      switch (eventType) {
        case "ai.partial_result":
          this.chat?.handleEvent(
            "ai.partial_result",
            params.text ?? "",
            params.barged ?? false,
          );
          break;
        case "ai.speech_detect": {
          const cleanText = (params.text ?? "").replace(
            /\{confidence=[\d.]+\}/,
            "",
          );
          this.chat?.handleEvent(
            "ai.speech_detect",
            cleanText,
            params.type !== "normal",
          );
          break;
        }
        case "ai.transparent_barge":
          this.chat?.handleEvent(
            "ai.transparent_barge",
            params.combined_text ?? "",
            true,
          );
          break;
        case "ai.completion":
          this.chat?.handleEvent(
            "ai.completion",
            params.text ?? "",
            params.type === "barged",
          );
          break;
        case "ai.response":
        case "ai.response_utterance":
          this.chat?.handleEvent(
            "ai.response_utterance",
            params.response ?? params.utterance ?? "",
            false,
          );
          break;
        case "user_event": {
          console.log("user_event", params);
          const userEvent = new CustomEvent("user_event", {
            detail: params,
            bubbles: true,
          });
          this.widget.dispatchEvent(userEvent);
          break;
        }
      }
    });
    this.subscriptions.push(signalingEventSub);

    // Subscribe to local stream for local video display
    const localStreamSub = call.localStream$.subscribe(
      (stream: MediaStream | null) => {
        if (stream) {
          devices.updateVideoAspectRatio(stream);
          const { localVideo } = html`<video
            autoplay
            playsinline
            muted
            name="localVideo"
          ></video>`();

          (localVideo as HTMLVideoElement).onloadedmetadata = () => {
            devices.onAspectRatioChange(
              (localVideo as HTMLVideoElement).videoWidth /
                (localVideo as HTMLVideoElement).videoHeight,
            );
          };

          (localVideo as HTMLVideoElement).srcObject = stream;
          onLocalVideo(localVideo as HTMLVideoElement);
        }
      },
    );
    this.subscriptions.push(localStreamSub);

    // Subscribe to remote stream and attach to container
    if (container) {
      let remoteVideoEl: HTMLVideoElement | null = null;
      const remoteStreamSub = call.remoteStream$.subscribe(
        (stream: MediaStream | null) => {
          if (stream) {
            if (!remoteVideoEl) {
              remoteVideoEl = document.createElement("video");
              remoteVideoEl.autoplay = true;
              remoteVideoEl.playsInline = true;
              container.appendChild(remoteVideoEl);
            }
            remoteVideoEl.srcObject = stream;
          }
        },
      );
      this.subscriptions.push(remoteStreamSub);
    }

    // Subscribe to call status
    const statusSub = call.status$.subscribe(async (status: string) => {
      if (status === "connected") {
        const callStartedEvent = new CustomEvent("call.joined", {
          detail: {
            call: this.currentCall,
            client: this.client,
          },
          bubbles: true,
        });
        this.widget.dispatchEvent(callStartedEvent);
        // @ts-ignore
        window.call = call;
        // Apply saved device preferences now that call is fully joined
        await devices.onCallStarted();
      }

      if (status === "destroyed" || status === "failed") {
        const callEndedEvent = new CustomEvent("call.left", {
          detail: { call: this.currentCall },
          bubbles: true,
        });
        this.widget.dispatchEvent(callEndedEvent);

        const destroyEvent = new CustomEvent("destroy", {
          detail: { call: this.currentCall },
          bubbles: true,
        });
        this.widget.dispatchEvent(destroyEvent);
      }
    });
    this.subscriptions.push(statusSub);

    return call;
  }

  // No-op: calls start automatically in the new SDK
  async start() {}

  async hangup() {
    if (!this.currentCall) {
      throw new Error("Call is not set");
    }
    await this.currentCall.hangup();
  }

  async destroy() {
    if (this.currentCall) {
      await this.currentCall.hangup();
    }

    this.subscriptions.forEach((s) => s.unsubscribe());
    this.subscriptions = [];

    if (this.client) {
      this.client.destroy();
      this.client = null;
    }

    this.currentCall = null;
    this.chat = null;
  }

  reset() {
    this.currentCall?.hangup();
    this.currentCall = null;
    this.chat = new Chat();
  }
}

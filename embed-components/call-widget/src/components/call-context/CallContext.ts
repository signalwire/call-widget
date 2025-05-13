// The context class that holds and does everything relating to the client and the call
// in it's own place

import { FabricRoomSession, SignalWireClient, SignalWireClientParams, IncomingCallNotification, SignalWire } from '@signalwire/js';
import devices from '../../utils/Devices';
import { Chat, ChatEntry } from './Chat';

export interface UserVariables {
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  callOriginHref?: string;
  [key: string]: any;
}

export interface CallContextEvents {
  onClientReady?: (client: SignalWireClient) => void;
  onIncomingCall?: (notification: IncomingCallNotification) => void;
  onCallStarted?: () => void;
  onCallEnded?: () => void;
  onChatChange?: (chatHistory: ChatEntry[]) => void;
  onLocalVideo?: (localVideo: HTMLVideoElement) => void;
  onError?: (error: { name?: string; message: string }) => void;
}

export interface CallContextConfig {
  token: string;
  destination: string;
  audio?: boolean;
  video?: boolean;
  userVariables?: UserVariables;
  debugLogWsTraffic?: boolean;
  host?: string;
  logLevel?: SignalWireClientParams['logLevel'];
  audioCodecs?: string[] | string;
  events?: CallContextEvents;
  rootElement?: HTMLElement;
}

export class CallContext {
  private client: any = null;
  private currentCall: FabricRoomSession | null = null;
  private config: CallContextConfig;
  private chat: Chat;

  constructor(config: CallContextConfig) {
    this.config = {
      audio: true,
      video: false,
      userVariables: {},
      logLevel: 'info',
      ...config,
      audioCodecs:
        typeof config.audioCodecs === 'string'
          ? config.audioCodecs
              .split(',')
              .map(codec => codec.trim())
              .filter(Boolean)
          : config.audioCodecs,
    };
    this.chat = new Chat();
    this.chat.onUpdate = () => {
      this.config.events?.onChatChange?.(this.chat.getHistory());
    };
  }

  private async getWidgetToken(embedsToken: string) {
    const response = await fetch('https://embeds.signalwire.com/api/fabric/embeds/tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: embedsToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to authenticate embeds token');
    }

    const data = await response.json();
    return data.token;
  }

  private setupAIEventHandlers(client: any) {
    client.on('ai.partial_result', (params: any) => {
      this.chat.handleEvent('ai.partial_result', params.text ?? '', params.barged ?? false);
    });

    client.on('ai.speech_detect', (params: any) => {
      const cleanText = params.text.replace(/\{confidence=[\d.]+\}/, '');
      this.chat.handleEvent('ai.speech_detect', cleanText, params.type !== 'normal');
    });

    client.on('ai.completion', (params: any) => {
      this.chat.handleEvent('ai.completion', params.text ?? '', params.type === 'barged');
    });

    client.on('ai.response_utterance', (params: any) => {
      this.chat.handleEvent('ai.response_utterance', params.utterance ?? '', false);
    });
  }

  async initialize() {
    if (!this.config.token) {
      throw new Error('Token is required');
    }

    try {
      let clientToken = this.config.token;
      if (clientToken.startsWith('c2c_')) {
        clientToken = await this.getWidgetToken(clientToken);
      }

      const config: SignalWireClientParams = {
        token: clientToken,
        incomingCallHandlers: {
          all: callNotification => {
            this.config.events?.onIncomingCall?.(callNotification);
          },
        },
        userVariables: {
          callOriginHref: typeof window !== 'undefined' ? window.location.href : undefined,
          ...this.config.userVariables,
        },
        host: this.config.host,
        logLevel: this.config.logLevel,
      };

      if (this.config.debugLogWsTraffic) {
        config.debug = {
          logWsTraffic: true,
        };
      }

      this.client = await SignalWire(config);
      this.setupAIEventHandlers(this.client);

      this.client.on('error', (error: any) => {
        this.config.events?.onError?.({ name: 'ClientError', message: error.message || 'Client encountered an error' });
      });

      this.client.on('disconnect', (error: any) => {
        if (error) {
          this.config.events?.onError?.({ name: 'ConnectionError', message: 'Connection to SignalWire was lost' });
        }
      });

      this.config.events?.onClientReady?.(this.client);
      return this.client;
    } catch (error: any) {
      this.config.events?.onError?.({ name: 'InitializationError', message: error.message || 'Failed to initialize client' });
      throw error;
    }
  }

  async dial() {
    if (!this.client) {
      const error = new Error('Client not initialized');
      this.config.events?.onError?.({ name: 'DialError', message: error.message });
      throw error;
    }

    try {
      const permissionResult = await devices.getPermissions(this.config.video);
      if (!permissionResult.success) {
        const error = new Error(permissionResult.message || 'Error getting device permissions');
        this.config.events?.onError?.({ name: 'DevicePermissionError', message: error.message });
        throw error;
      }

      ['ci-SAT', 'pt-SAT', 'as-SAT'].forEach(key => {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem(key);
        }
      });

      const dialParams: any = {
        to: this.config.destination,
        audio: this.config.audio,
        video: this.config.video,
        negotiateVideo: this.config.video,
        rootElement: this.config.rootElement,
      };

      if (this.config.audioCodecs?.length) {
        dialParams.audioCodecs = this.config.audioCodecs;
      }

      this.currentCall = await this.client.dial(dialParams);

      this.currentCall.on('call.joined', () => {
        this.config.events?.onCallStarted?.();
        if (this.currentCall?.localStream && this.config.rootElement) {
          devices.updateVideoAspectRatio();
          const localVideo = document.createElement('video');
          localVideo.autoplay = true;
          localVideo.playsInline = true;
          localVideo.muted = true;

          localVideo.onloadedmetadata = () => {
            devices.onAspectRatioChange(localVideo.videoWidth / localVideo.videoHeight);
          };

          localVideo.srcObject = this.currentCall.localStream;
          this.config.events?.onLocalVideo?.(localVideo);
        }
      });

      this.currentCall.on('call.updated', () => {
        console.log('call.updated', this.currentCall);
      });

      this.currentCall.on('destroy', () => {
        this.config.events?.onCallEnded?.();
        this.currentCall = null;
      });

      return this.currentCall;
    } catch (error: any) {
      this.config.events?.onError?.({ name: 'DialError', message: error.message || 'Failed to establish call' });
      throw error;
    }
  }

  async start() {
    await this.currentCall?.start();
  }

  async hangup() {
    await this.currentCall?.hangup();
  }

  reset() {
    if (this.client) {
      this.client.off('ai.partial_result');
      this.client.off('ai.speech_detect');
      this.client.off('ai.completion');
      this.client.off('ai.response_utterance');
      this.client.disconnect();
    }
    this.currentCall = null;
    this.client = null;
    this.chat = new Chat();
  }

  getClient() {
    return this.client;
  }

  getCurrentCall() {
    return this.currentCall;
  }

  getLocalVideoTrack() {
    return this.currentCall?.localVideoTrack;
  }

  getLocalAudioTrack() {
    return this.currentCall?.localAudioTrack;
  }

  getChatHistory() {
    return this.chat.getHistory();
  }

  updateUserVariables(variables: UserVariables) {
    this.config.userVariables = {
      ...this.config.userVariables,
      ...variables,
    };
  }
}

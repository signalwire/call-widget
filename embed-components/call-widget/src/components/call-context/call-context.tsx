import { Component, Prop, h, Event, EventEmitter, Method, Watch, Element, State } from '@stencil/core';
import { SignalWire, IncomingCallNotification, SignalWireClientParams } from '@signalwire/js';
import devices from '../../utils/Devices';

@Component({
  tag: 'call-context',
  styleUrl: 'call-context.css',
  shadow: true,
})
export class CallContext {
  @Element() el!: HTMLElement;
  @Prop() token!: string;
  @Prop() destination!: string;
  @Prop() audio: boolean = true;
  @Prop() video: boolean = false;
  @Prop() userVariables: string = '{}';
  @Prop() debugLogWsTraffic?: boolean;
  @Prop() host?: string;
  @Prop() logLevel?: SignalWireClientParams['logLevel'] = 'info';
  @Prop() audioCodecs?: string;

  @State() dialogTitle: string = '';
  @State() dialogMessage: string = '';
  @State() showDialog: boolean = false;

  private parsedUserVariables: Record<string, any> = {};
  private parsedAudioCodecs: string[] = [];
  private hasTranscriptViewer: boolean = false;

  @Event() clientReady: EventEmitter<any>;
  @Event() clientIncomingCall: EventEmitter<IncomingCallNotification>;
  @Event() callStarted: EventEmitter<void>;
  @Event() callEnded: EventEmitter<void>;

  private client: any;
  private currentCall: any;

  @Watch('userVariables')
  parseUserVariables(newValue: string) {
    try {
      this.parsedUserVariables = JSON.parse(newValue);
    } catch (error) {
      console.error('Failed to parse userVariables:', error);
      this.parsedUserVariables = {};
    }
  }

  @Watch('audioCodecs')
  parseAudioCodecs(newValue: string | undefined) {
    if (newValue) {
      this.parsedAudioCodecs = newValue.split(',').map(codec => codec.trim());
    } else {
      this.parsedAudioCodecs = [];
    }
  }

  componentWillLoad() {
    this.parseUserVariables(this.userVariables);
    this.parseAudioCodecs(this.audioCodecs);
    this.checkForTranscriptViewer();
    if (!this.token) {
      console.warn('Token is empty, skipping client initialization');
      return;
    }
    this.initializeClient()
      .then(client => {
        this.client = client;
        this.clientReady.emit(this.client);
      })
      .catch(error => {
        console.error('Failed to initialize client:', error);
      });
  }

  private checkForTranscriptViewer() {
    const transcriptViewer = this.el.querySelector('call-transcript-viewer');
    this.hasTranscriptViewer = !!transcriptViewer;
  }

  private handleDialogClose = () => {
    this.showDialog = false;
  };

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

  private async initializeClient() {
    let clientToken = this.token;
    if (this.token.startsWith('c2c_')) {
      clientToken = await this.getWidgetToken(this.token);
      console.log('clientToken', clientToken);
    }

    const config: SignalWireClientParams = {
      token: clientToken,
      incomingCallHandlers: {
        all: callNotification => {
          this.clientIncomingCall.emit(callNotification);
        },
      },
      userVariables: this.parsedUserVariables,
      host: this.host,
      logLevel: this.logLevel,
    };

    if (this.debugLogWsTraffic) {
      config.debug = {
        logWsTraffic: true,
      };
    }

    return await SignalWire(config);
  }

  @Method()
  async dial() {
    try {
      if (!this.client) {
        throw new Error('Client not initialized');
      }

      const permissionResult = await devices.getPermissions(this.video);
      if (!permissionResult.success) {
        console.error('Error getting permissions');
        this.dialogTitle = 'Error Accessing Devices';
        this.dialogMessage = permissionResult.message || 'Error getting device permissions. Please grant this page access and try again.';
        this.showDialog = true;
        return;
      }

      const dialParams: any = {
        to: this.destination,
        audio: this.audio,
        video: this.video,
      };

      if (this.parsedAudioCodecs.length > 0) {
        dialParams.audioCodecs = this.parsedAudioCodecs;
      }

      this.currentCall = await this.client.dial(dialParams);

      this.currentCall.on('destroy', () => {
        this.callEnded.emit();
        this.currentCall = null;
      });

      this.callStarted.emit();
      return this.currentCall;
    } catch (error) {
      console.error('Failed to dial:', error);
      throw error;
    }
  }

  render() {
    const containerClass = this.hasTranscriptViewer ? 'call-context with-transcript' : 'call-context';

    return (
      <div class={containerClass}>
        <div class="video-container">
          <slot name="video"></slot>
          <slot name="transcript"></slot>
        </div>
        {this.hasTranscriptViewer && (
          <div class="transcript-container">
            <slot name="transcript"></slot>
          </div>
        )}
        {this.showDialog && <call-information-dialog title={this.dialogTitle} message={this.dialogMessage} onDialogClosed={this.handleDialogClose} />}
      </div>
    );
  }
}

import { Component, Prop, h, Event, EventEmitter, Method, Watch, Element, State } from '@stencil/core';
import { IncomingCallNotification, SignalWireClient, SignalWireClientParams } from '@signalwire/js';
import { CallContext } from './CallContext';

@Component({
  tag: 'call-context',
  styleUrl: 'call-context.css',
  shadow: true,
})
export class CallContextComponent {
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
  private hasTranscriptViewer: boolean = false;
  private callContext: CallContext;

  @Event() clientReady: EventEmitter<SignalWireClient>;
  @Event() clientIncomingCall: EventEmitter<IncomingCallNotification>;
  @Event() callStarted: EventEmitter<void>;
  @Event() callEnded: EventEmitter<void>;
  @Event() callError: EventEmitter<{ type: string; message: string }>;

  @Watch('userVariables')
  parseUserVariables(newValue: string) {
    try {
      this.parsedUserVariables = JSON.parse(newValue);
    } catch (error) {
      console.error('Failed to parse userVariables:', error);
      this.parsedUserVariables = {};
    }
  }

  private handleDialogClose = () => {
    this.showDialog = false;
  };

  componentWillLoad() {
    this.parseUserVariables(this.userVariables);
    this.checkForTranscriptViewer();

    if (!this.token) {
      console.warn('Token is empty, skipping client initialization');
      return;
    }

    this.callContext = new CallContext({
      token: this.token,
      destination: this.destination,
      audio: this.audio,
      video: this.video,
      userVariables: this.parsedUserVariables,
      debugLogWsTraffic: this.debugLogWsTraffic,
      host: this.host,
      logLevel: this.logLevel as any,
      audioCodecs: this.audioCodecs?.split(',').map(codec => codec.trim()),
      events: {
        onClientReady: client => this.clientReady.emit(client),
        onIncomingCall: notification => this.clientIncomingCall.emit(notification),
        onCallStarted: () => this.callStarted.emit(),
        onCallEnded: () => this.callEnded.emit(),
        onError: error => {
          this.callError.emit({
            type: error.name || 'CallError',
            message: error.message || 'An error occurred during the call',
          });
          this.dialogTitle = 'Call Error';
          this.dialogMessage = error.message || 'An error occurred during the call';
          this.showDialog = true;
        },
      },
    });

    this.callContext.initialize().catch(error => {
      console.error('Failed to initialize client:', error);
      this.callError.emit({
        type: 'InitializationError',
        message: error.message || 'Failed to initialize call client',
      });
    });
  }

  private checkForTranscriptViewer() {
    const transcriptViewer = this.el.querySelector('call-transcript-viewer');
    this.hasTranscriptViewer = !!transcriptViewer;
  }

  @Method()
  async dial() {
    try {
      return await this.callContext.dial();
    } catch (error) {
      console.error('Failed to dial:', error);
      const errorType = error.message?.includes('device permissions') ? 'DevicePermissionError' : 'DialError';
      this.callError.emit({
        type: errorType,
        message: error.message || 'Failed to establish call',
      });
      if (error.message?.includes('device permissions')) {
        this.dialogTitle = 'Error Accessing Devices';
        this.dialogMessage = error.message;
        this.showDialog = true;
      }
      throw error;
    }
  }

  @Method()
  async getCallContext() {
    return this.callContext;
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
        {this.showDialog && <call-information-dialog messageTitle={this.dialogTitle} message={this.dialogMessage} onDialogClosed={this.handleDialogClose} />}
      </div>
    );
  }
}

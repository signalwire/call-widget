import { Component, h, Element, State, Listen } from '@stencil/core';

@Component({
  tag: 'call-audio',
  styleUrl: 'call-audio.css',
  shadow: true,
})
export class CallAudio {
  @Element() el: HTMLElement;
  @State() client: any;
  @State() isCallActive: boolean = false;
  @State() isMuted: boolean = false;

  @Listen('clientReady')
  onClientReady(event: CustomEvent) {
    this.client = event.detail;
  }

  async startCall() {
    if (!this.client) {
      console.error('Client not initialized');
      return;
    }

    try {
      this.isCallActive = true;
      // Placeholder for actual audio call implementation
      // This would use the SignalWire SDK to start an audio call
    } catch (error) {
      console.error('Failed to start call:', error);
      this.isCallActive = false;
    }
  }

  async endCall() {
    if (!this.client) return;

    try {
      this.isCallActive = false;
      // Placeholder for actual call end implementation
    } catch (error) {
      console.error('Failed to end call:', error);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    // Placeholder for actual mute implementation
  }

  render() {
    return (
      <div class="audio-call-container">
        <div class="call-status">{this.isCallActive ? 'Call in progress' : 'Ready to call'}</div>
        <div class="controls">
          {!this.isCallActive ? (
            <button onClick={() => this.startCall()} class="start-call">
              Start Call
            </button>
          ) : (
            <div class="active-call-controls">
              <button onClick={() => this.toggleMute()} class={`mute ${this.isMuted ? 'muted' : ''}`}>
                {this.isMuted ? 'Unmute' : 'Mute'}
              </button>
              <button onClick={() => this.endCall()} class="end-call">
                End Call
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
}

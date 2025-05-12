import { Component, h, Prop, State, Listen } from '@stencil/core';
import { IncomingCallNotification } from '@signalwire/js';

@Component({
  tag: 'call-incoming',
  styleUrl: 'call-incoming.css',
  shadow: true,
})
export class CallIncoming {
  @Prop() showModal: boolean = true;
  @State() incomingCall: IncomingCallNotification | null = null;

  @Listen('clientIncomingCall')
  handleIncomingCall(event: CustomEvent<IncomingCallNotification>) {
    this.incomingCall = event.detail;
  }

  private async handleAccept() {
    if (this.incomingCall) {
      try {
        await this.incomingCall.invite.accept({
          audio: true,
          video: false,
        });
        this.incomingCall = null;
      } catch (error) {
        console.error('Failed to accept call:', error);
      }
    }
  }

  private async handleReject() {
    if (this.incomingCall) {
      try {
        await this.incomingCall.invite.reject();
        this.incomingCall = null;
      } catch (error) {
        console.error('Failed to reject call:', error);
      }
    }
  }

  render() {
    if (!this.showModal || !this.incomingCall) {
      return null;
    }

    return (
      <div class="incoming-call-modal">
        <div class="modal-content">
          <h3>Incoming Call</h3>
          <p>From: {this.incomingCall.invite.details.caller_id_name}</p>
          <div class="button-group">
            <button onClick={() => this.handleAccept()} class="accept">
              Accept
            </button>
            <button onClick={() => this.handleReject()} class="reject">
              Reject
            </button>
          </div>
        </div>
      </div>
    );
  }
}

import { Component, h, Event, EventEmitter, Element } from '@stencil/core';
import type { CallContext } from '../call-context/CallContext';

declare global {
  interface HTMLCallContextElement extends HTMLElement {
    getCallContext(): Promise<CallContext>;
  }
}

@Component({
  tag: 'call-video',
  styleUrl: 'call-video.css',
  shadow: true,
})
export class CallVideo {
  @Element() el!: HTMLElement;
  @Event() hangup: EventEmitter<void>;

  private async getParentCallContext(): Promise<CallContext> {
    const parent = this.el.closest('call-context') as HTMLCallContextElement;
    if (!parent) {
      throw new Error('call-video must be used within a call-context element');
    }
    return parent.getCallContext();
  }

  private handleHangup = async () => {
    const callContext = await this.getParentCallContext();
    await callContext.hangup();
    this.hangup.emit();
  };

  render() {
    return (
      <div class="video-panel">
        <div class="video-panel-background"></div>
        <div class="video-area">
          <div class="video-content">
            <slot name="remote-video"></slot>
          </div>
        </div>
        <div class="local-video-content">
          <slot name="local-video"></slot>
        </div>
        <div class="video-controls">
          <call-controls></call-controls>
        </div>
      </div>
    );
  }
}

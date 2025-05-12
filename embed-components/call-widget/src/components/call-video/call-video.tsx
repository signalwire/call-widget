import { Component, h, Event, EventEmitter } from '@stencil/core';

@Component({
  tag: 'call-video',
  styleUrl: 'call-video.css',
  shadow: true,
})
export class CallVideo {
  @Event() hangup: EventEmitter<void>;

  private handleHangup = () => {
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
          <call-controls onHangup={this.handleHangup}></call-controls>
        </div>
      </div>
    );
  }
}

import { Component, h, Prop, Watch, Element } from '@stencil/core';

export interface TranscriptEntry {
  type: 'user' | 'agent';
  text: string;
  state?: 'complete' | 'partial';
}

@Component({
  tag: 'call-transcript-viewer',
  styleUrl: 'call-transcript-viewer.css',
  shadow: true,
})
export class CallTranscriptViewer {
  @Element() el!: HTMLElement;
  @Prop() transcriptHistory: TranscriptEntry[] = [];
  private hostElement: HTMLElement;

  componentDidLoad() {
    this.hostElement = this.el.shadowRoot?.querySelector('.transcript-container') as HTMLElement;
  }

  @Watch('transcriptHistory')
  transcriptHistoryChanged() {
    if (this.hostElement) {
      const isScrolledToBottom = this.hostElement.scrollHeight - this.hostElement.clientHeight <= this.hostElement.scrollTop + 300;

      if (isScrolledToBottom) {
        requestAnimationFrame(() => {
          this.hostElement.scrollTo({
            top: this.hostElement.scrollHeight,
            behavior: 'smooth',
          });
        });
      }
    }
  }

  render() {
    const messages = this.transcriptHistory.map(entry => {
      const messageClass = entry.type === 'user' ? 'message-sent' : 'message-received';
      const inProgressClass = entry.state === 'partial' ? 'in-progress' : '';

      return (
        <div class={`message ${messageClass} ${inProgressClass}`}>
          {entry.text}
          <div class="tail">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 13">
              <path d="M5.942 12.63c-1.445 0-2.775-.763-3.487-2.022L.083 5.44C-.31 4.672-.12 3.71.544 3.145l4.597-3.925c.733-.627 1.833-.539 2.457.198.606.714.539 1.781-.157 2.42l-3.13 2.669c-.202.173-.224.475-.05.677.173.202.474.224.676.05l3.131-2.669c1.133-1.035 1.264-2.793.294-3.93C7.599-2.276 5.791-2.42 4.61-.993L.013 2.933c-1.077.917-1.378 2.467-.733 3.733l2.372 5.167c.892 1.583 2.575 2.563 4.397 2.563.084 0 .168-.002.252-.006.853-.041 1.553-.714 1.62-1.566.068-.856-.53-1.62-1.386-1.772-2.116-.377-3.333-2.605-2.56-4.68.225-.606.596-1.117 1.074-1.481.213-.161.254-.465.093-.677-.16-.213-.464-.254-.676-.093-.604.457-1.07 1.091-1.35 1.835-.974 2.615.558 5.522 3.216 5.996 1.379.246 2.332 1.472 2.22 2.858-.109 1.386-1.235 2.461-2.61 2.52-.084.003-.167.005-.25.005z" />
            </svg>
          </div>
        </div>
      );
    });

    return (
      <div class="transcript-container">
        <div class="transcript">{messages}</div>
      </div>
    );
  }
}

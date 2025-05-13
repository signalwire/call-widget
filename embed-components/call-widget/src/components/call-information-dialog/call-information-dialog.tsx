import { Component, h, Prop, Event, EventEmitter } from '@stencil/core';

@Component({
  tag: 'call-information-dialog',
  styleUrl: 'call-information-dialog.css',
  shadow: true,
})
export class CallInformationDialog {
  @Prop() messageTitle!: string;
  @Prop() message!: string;
  @Event() dialogClosed: EventEmitter<void>;

  private handleClose = () => {
    this.dialogClosed.emit();
  };

  render() {
    return (
      <div class="dialog-overlay">
        <div class="dialog-content">
          <h2>{this.messageTitle}</h2>
          <p>{this.message}</p>
          <button class="close-button" onClick={this.handleClose}>
            Close
          </button>
        </div>
      </div>
    );
  }
}

import { Component, h } from '@stencil/core';
import microphoneIcon from '../../icons/microphone.svg';

@Component({
  tag: 'call-icon',
  styleUrl: 'call-icon.css',
  shadow: true,
})
export class CallIcon {
  render() {
    return <img src={microphoneIcon} />;
  }
}

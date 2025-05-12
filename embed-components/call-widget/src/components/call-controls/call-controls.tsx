import { Component, h, State, Event, EventEmitter, Element } from '@stencil/core';
import Devices from '../../utils/Devices';
import checkIcon from '../../icons/check.svg';
import videoOffIcon from '../../icons/video-off.svg';
import videoIcon from '../../icons/video.svg';
import microphoneOffIcon from '../../icons/microphone-off.svg';
import microphoneIcon from '../../icons/microphone.svg';
import speakerOffIcon from '../../icons/speaker-off.svg';
import speakerIcon from '../../icons/speaker.svg';
import callEndIcon from '../../icons/callEnd.svg';
import caretUpIcon from '../../icons/caret-up.svg';

@Component({
  tag: 'call-controls',
  styleUrl: 'call-controls.css',
  shadow: true,
})
export class CallControls {
  @Element() el!: HTMLElement;
  @Event() hangup: EventEmitter<void>;
  @State() updateCounter: number = 0;

  componentDidLoad() {
    Devices.onChange = () => {
      // Force a re-render by updating the counter
      this.updateCounter++;
    };

    // Close menus when clicking outside
    document.addEventListener('click', () => {
      const menus = this.el.shadowRoot?.querySelectorAll('.device-menu');
      menus?.forEach(menu => ((menu as HTMLElement).style.display = 'none'));
    });
  }

  private renderDeviceMenu(
    devices: MediaDeviceInfo[],
    selected: MediaDeviceInfo | null,
    type: 'camera' | 'microphone' | 'speaker',
    onSelect: (deviceId: string) => Promise<boolean>,
  ) {
    return devices.map(device => (
      <div class={{ 'device-option': true, 'selected': device.deviceId === selected?.deviceId }} onClick={() => onSelect(device.deviceId)}>
        {device.deviceId === selected?.deviceId && <img src={checkIcon} />}
        {device.label || `${type} ${devices.indexOf(device) + 1}`}
      </div>
    ));
  }

  private handleDeviceMenuClick = (e: MouseEvent) => {
    e.stopPropagation();
    const button = e.currentTarget as HTMLButtonElement;
    const menu = button.nextElementSibling as HTMLElement;
    const allMenus = this.el.shadowRoot?.querySelectorAll('.device-menu');

    allMenus?.forEach(m => {
      if (m !== menu) (m as HTMLElement).style.display = 'none';
    });

    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
  };

  render() {
    // updateCounter is used in render to force updates
    this.updateCounter;

    const { isVideoMuted, isAudioMuted, isSpeakerMuted, selectedCamera, selectedMicrophone, selectedSpeaker } = Devices.state;
    const videoinput = Devices.state.videoinput;
    const audioinput = Devices.state.audioinput;
    const audiooutput = Devices.state.audiooutput;

    return (
      <div class="controls-container">
        <div class="controls">
          <div class="control-group">
            <button class={{ 'control-button': true, 'video-button': true, 'standalone': videoinput.length === 0 }} onClick={() => Devices.toggleVideo()}>
              <span class="muted-icon" style={{ display: isVideoMuted ? 'block' : 'none' }}>
                <img src={videoOffIcon} />
              </span>
              <span class="unmuted-icon" style={{ display: isVideoMuted ? 'none' : 'block' }}>
                <img src={videoIcon} />
              </span>
            </button>
            {videoinput.length > 0 && (
              <div class="device-select-wrapper">
                <button class="device-select-button video-devices-button" disabled={isVideoMuted} onClick={this.handleDeviceMenuClick}>
                  <img src={caretUpIcon} />
                </button>
                <div class="device-menu" style={{ display: 'none' }}>
                  {this.renderDeviceMenu(videoinput, selectedCamera, 'camera', deviceId => Devices.updateCamera(deviceId))}
                </div>
              </div>
            )}
          </div>

          <div class="control-group">
            <button class={{ 'control-button': true, 'mic-button': true, 'standalone': audioinput.length === 0 }} onClick={() => Devices.toggleAudio()}>
              <span class="muted-icon" style={{ display: isAudioMuted ? 'block' : 'none' }}>
                <img src={microphoneOffIcon} />
              </span>
              <span class="unmuted-icon" style={{ display: isAudioMuted ? 'none' : 'block' }}>
                <img src={microphoneIcon} />
              </span>
            </button>
            {audioinput.length > 0 && (
              <div class="device-select-wrapper">
                <button class="device-select-button mic-devices-button" disabled={isAudioMuted} onClick={this.handleDeviceMenuClick}>
                  <img src={caretUpIcon} />
                </button>
                <div class="device-menu" style={{ display: 'none' }}>
                  {this.renderDeviceMenu(audioinput, selectedMicrophone, 'microphone', deviceId => Devices.updateMicrophone(deviceId))}
                </div>
              </div>
            )}
          </div>

          <div class="control-group">
            <button class={{ 'control-button': true, 'speaker-button': true, 'standalone': audiooutput.length === 0 }} onClick={() => Devices.toggleSpeaker()}>
              <span class="muted-icon" style={{ display: isSpeakerMuted ? 'block' : 'none' }}>
                <img src={speakerOffIcon} />
              </span>
              <span class="unmuted-icon" style={{ display: isSpeakerMuted ? 'none' : 'block' }}>
                <img src={speakerIcon} />
              </span>
            </button>
            {audiooutput.length > 0 && (
              <div class="device-select-wrapper">
                <button class="device-select-button speaker-devices-button" disabled={isSpeakerMuted} onClick={this.handleDeviceMenuClick}>
                  <img src={caretUpIcon} />
                </button>
                <div class="device-menu" style={{ display: 'none' }}>
                  {this.renderDeviceMenu(audiooutput, selectedSpeaker, 'speaker', deviceId => Devices.updateSpeaker(deviceId))}
                </div>
              </div>
            )}
          </div>

          <button class="control-button hangup" onClick={() => this.hangup.emit()}>
            <img src={callEndIcon} />
          </button>
        </div>
      </div>
    );
  }
}

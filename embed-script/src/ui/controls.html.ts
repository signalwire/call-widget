import html from "../lib/html";
import callEndIcon from "../icons/callEnd.svg?raw";
import videoIcon from "../icons/video.svg?raw";
import microphoneIcon from "../icons/microphone.svg?raw";
import speakerIcon from "../icons/speaker.svg?raw";
import caretUpIcon from "../icons/caret-up.svg?raw";
import videoOffIcon from "../icons/video-off.svg?raw";
import microphoneOffIcon from "../icons/microphone-off.svg?raw";
import speakerOffIcon from "../icons/speaker-off.svg?raw";

export default html`
  <div name="controlsContainer">
    <div class="controls">
      <div class="control-group">
        <button class="control-button video-button" name="videoButton">
          <span class="muted-icon" style="display: none;">${videoOffIcon}</span>
          <span class="unmuted-icon">${videoIcon}</span>
        </button>
        <div class="device-select-wrapper">
          <button
            class="device-select-button video-devices-button"
            name="videoDevicesButton"
          >
            ${caretUpIcon}
          </button>
          <div
            class="device-menu"
            name="videoDevicesMenu"
            style="display: none;"
          >
            <!-- Populated via JS -->
          </div>
        </div>
      </div>

      <div class="control-group">
        <button class="control-button mic-button" name="micButton">
          <span class="muted-icon" style="display: none;"
            >${microphoneOffIcon}</span
          >
          <span class="unmuted-icon">${microphoneIcon}</span>
        </button>
        <div class="device-select-wrapper">
          <button
            class="device-select-button mic-devices-button"
            name="micDevicesButton"
          >
            ${caretUpIcon}
          </button>
          <div class="device-menu" name="micDevicesMenu" style="display: none;">
            <!-- Populated via JS -->
          </div>
        </div>
      </div>

      <div class="control-group">
        <button class="control-button speaker-button" name="speakerButton">
          <span class="muted-icon" style="display: none;"
            >${speakerOffIcon}</span
          >
          <span class="unmuted-icon">${speakerIcon}</span>
        </button>
        <div class="device-select-wrapper">
          <button
            class="device-select-button speaker-devices-button"
            name="speakerDevicesButton"
          >
            ${caretUpIcon}
          </button>
          <div
            class="device-menu"
            name="speakerDevicesMenu"
            style="display: none;"
          >
            <!-- Populated via JS -->
          </div>
        </div>
      </div>

      <button class="control-button hangup" name="hangupButton">
        ${callEndIcon}
      </button>
    </div>
  </div>
`;

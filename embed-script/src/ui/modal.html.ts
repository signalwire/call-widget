import html from "../lib/html";
import { style } from "../Style";
import globalcss from "../css/index.scss?inline";

// We are registering global css here, somewhat arbitrarily.
// Nowhere else will we be importing css or registering styles.
style.register(globalcss);

export default html`
  <div class="modal-container" name="modalContainer">
    <div class="modal" name="modal">
      <div class="video-panel" name="videoPanel">
        <div class="video-panel-background" name="videoPanelBackground"></div>
        <div class="local-video-content" name="localVideoArea">
          <!-- Local Video area -->
        </div>
        <div class="video-area">
          <div class="video-content" name="videoArea">
            <!-- Remote Video area -->
          </div>
        </div>
        <div class="video-controls" name="controlsPanel">
          <!-- Controls panel -->
        </div>
      </div>
      <div class="chat-panel" name="chatPanel"></div>
    </div>
  </div>
`;

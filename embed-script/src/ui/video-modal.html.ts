import html from "../lib/html";
import { style } from "../Style";
import globalcss from "../css/index.scss?inline";

style.register(globalcss);

export default html`
  <div class="modal-container" name="modalContainer">
    <div class="modal" name="modal">
      <div class="video-panel" name="videoPanel">
        <div class="video-panel-background" name="videoPanelBackground"></div>
        <div class="local-video-content" name="localVideoArea"></div>
        <div class="video-area">
          <div class="video-content" name="videoArea"></div>
        </div>
        <div class="video-controls" name="controlsPanel"></div>
      </div>
    </div>
  </div>
`;

import html from "../lib/html";
import { style } from "../Style";
import globalcss from "../css/index.scss?inline";

style.register(globalcss);

export default html`
  <div class="modal-container" name="modalContainer">
    <div class="modal" name="modal">
      <div class="transcript-panel" name="transcriptPanel">
        <div class="video-controls" name="controlsPanel"></div>
        <div class="transcript-area" name="transcriptArea"></div>
      </div>
    </div>
  </div>
`;

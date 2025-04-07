import html from "../lib/html";

export default html`<div class="error-message" name="errorModal">
  <div class="error-header">
    <h3 class="error-title" name="titleEl"></h3>
  </div>
  <div class="error-content">
    <div class="error-text" name="messageEl"></div>
    <button class="action-button" name="closeButton">Close</button>
  </div>
</div> `;

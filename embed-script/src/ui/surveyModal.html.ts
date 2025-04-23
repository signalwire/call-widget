import html from "../lib/html";
import externalLinkIcon from "../icons/external-link.svg?raw";

export default html`<div class="survey-message" name="surveyModal">
  <div class="survey-header">
    <h3 class="survey-title" name="titleEl"></h3>
  </div>
  <div class="survey-content">
    <div class="survey-text" name="messageEl"></div>
    <div class="survey-actions">
      <button class="action-button outlined" name="closeButton">Close</button>
      <a
        class="survey-link action-button primary"
        name="surveyLink"
        target="_blank"
      >
        Take Survey ${externalLinkIcon}
      </a>
    </div>
  </div>
</div>`;

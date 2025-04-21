import html from "../lib/html";
import closeIcon from "../icons/close.svg?raw";

export default html`
  <div class="user-form-container" name="userFormContainer">
    <button type="button" class="close-button" name="closeButton">
      ${closeIcon}
    </button>

    <form class="user-form" name="userForm">
      <input type="text" name="userName" placeholder="Your Name" />
      <input
        type="email"
        name="userEmail"
        placeholder="Your Email (optional)"
      />
      <input
        type="tel"
        name="userPhone"
        placeholder="Your Phone Number (optional)"
      />
      <div class="form-buttons">
        <button type="button" name="skipButton" class="skip-button">
          Skip
        </button>
        <button type="submit" class="submit-button">Start Call</button>
      </div>
    </form>
  </div>
`;

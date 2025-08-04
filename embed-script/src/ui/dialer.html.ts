import html from "../lib/html";
import closeIcon from "../icons/close.svg?raw";
import callIcon from "../icons/callEnd.svg?raw";

export default html`
  <div class="dialer-container" name="dialerContainer">
    <button type="button" class="close-button" name="closeButton">
      ${closeIcon}
    </button>

    <div class="dialer">
      <div class="number-display">
        <input
          type="text"
          name="numberInput"
          placeholder=""
          class="number-input"
        />
      </div>

      <div class="dialer-pad">
        <div class="dialer-row">
          <button type="button" class="dialer-key" data-digit="1">
            <span class="digit">1</span>
          </button>
          <button type="button" class="dialer-key" data-digit="2">
            <span class="digit">2</span>
            <span class="letters">ABC</span>
          </button>
          <button type="button" class="dialer-key" data-digit="3">
            <span class="digit">3</span>
            <span class="letters">DEF</span>
          </button>
        </div>

        <div class="dialer-row">
          <button type="button" class="dialer-key" data-digit="4">
            <span class="digit">4</span>
            <span class="letters">GHI</span>
          </button>
          <button type="button" class="dialer-key" data-digit="5">
            <span class="digit">5</span>
            <span class="letters">JKL</span>
          </button>
          <button type="button" class="dialer-key" data-digit="6">
            <span class="digit">6</span>
            <span class="letters">MNO</span>
          </button>
        </div>

        <div class="dialer-row">
          <button type="button" class="dialer-key" data-digit="7">
            <span class="digit">7</span>
            <span class="letters">PQRS</span>
          </button>
          <button type="button" class="dialer-key" data-digit="8">
            <span class="digit">8</span>
            <span class="letters">TUV</span>
          </button>
          <button type="button" class="dialer-key" data-digit="9">
            <span class="digit">9</span>
            <span class="letters">WXYZ</span>
          </button>
        </div>

        <div class="dialer-row">
          <button type="button" class="dialer-key" data-digit="*">
            <span class="digit">*</span>
          </button>
          <button type="button" class="dialer-key" data-digit="0">
            <span class="digit">0</span>
            <span class="letters">+</span>
          </button>
          <button type="button" class="dialer-key" data-digit="#">
            <span class="digit">#</span>
          </button>
        </div>
      </div>

      <div class="dialer-actions">
        <button type="button" class="backspace-button" name="backspaceButton">
          <span>⌫</span>
        </button>
        <button type="button" class="call-button" name="callButton">
          ${callIcon}
        </button>
      </div>
    </div>
  </div>
`;

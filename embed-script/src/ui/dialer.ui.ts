import dialer from "./dialer.html";

export interface DialerOptions {
  onCall: (phoneNumber: string) => void;
  onClose: () => void;
}

export function createDialer({ onCall, onClose }: DialerOptions) {
  const {
    dialerContainer,
    numberInput,
    closeButton,
    backspaceButton,
    callButton,
  } = dialer();

  let currentNumber = "";
  let longPressTimer: number | null = null;
  let backspaceInterval: number | null = null;

  const updateDisplay = () => {
    (numberInput as HTMLInputElement).value = currentNumber;
    (callButton as HTMLButtonElement).disabled = currentNumber.length === 0;
  };

  const fadeAndRemove = (callback: () => void) => {
    dialerContainer.classList.add("closing");
    const dialer = dialerContainer.querySelector(".dialer");
    dialer?.classList.add("closing");

    setTimeout(() => {
      dialerContainer.remove();
      callback();
    }, 800);
  };

  const deleteCharacter = () => {
    if (currentNumber.length > 0) {
      currentNumber = currentNumber.slice(0, -1);
      updateDisplay();
    }
  };

  const startBackspaceRepeat = () => {
    deleteCharacter();
    backspaceInterval = setInterval(() => {
      deleteCharacter();
    }, 400);
  };

  const stopBackspaceRepeat = () => {
    if (backspaceInterval) {
      clearInterval(backspaceInterval);
      backspaceInterval = null;
    }
  };

  closeButton.addEventListener("click", () => {
    fadeAndRemove(onClose);
  });

  // Backspace with long press support
  backspaceButton.addEventListener("mousedown", startBackspaceRepeat);
  backspaceButton.addEventListener("mouseup", stopBackspaceRepeat);
  backspaceButton.addEventListener("mouseleave", stopBackspaceRepeat);
  backspaceButton.addEventListener("touchstart", startBackspaceRepeat);
  backspaceButton.addEventListener("touchend", stopBackspaceRepeat);

  callButton.addEventListener("click", () => {
    if (currentNumber.trim()) {
      onCall(currentNumber); // Call immediately to start call setup
      fadeAndRemove(() => {}); // Fade out independently
    }
  });

  const dialerKeys = dialerContainer.querySelectorAll(".dialer-key");
  dialerKeys.forEach((key) => {
    const digit = (key as HTMLElement).dataset.digit;

    if (digit === "0") {
      // Special handling for "0" key with long press for "+"
      let longPressTriggered = false;

      const handlePress = () => {
        longPressTriggered = false;
        longPressTimer = setTimeout(() => {
          longPressTriggered = true;
          currentNumber += "+";
          updateDisplay();
        }, 500); // 500ms for long press
      };

      const handleRelease = () => {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }

        if (!longPressTriggered) {
          currentNumber += "0";
          updateDisplay();
        }
      };

      key.addEventListener("mousedown", handlePress);
      key.addEventListener("mouseup", handleRelease);
      key.addEventListener("mouseleave", () => {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
      });
      key.addEventListener("touchstart", (e) => {
        e.preventDefault();
        handlePress();
      });
      key.addEventListener("touchend", (e) => {
        e.preventDefault();
        handleRelease();
      });
    } else {
      // Regular key handling
      key.addEventListener("click", () => {
        if (digit) {
          currentNumber += digit;
          updateDisplay();
        }
      });
    }
  });

  // Allow all characters in input since it's for addresses
  (numberInput as HTMLInputElement).addEventListener("input", (e) => {
    const input = e.target as HTMLInputElement;
    currentNumber = input.value; // Accept all characters
    updateDisplay();
  });

  (numberInput as HTMLInputElement).addEventListener("keydown", (e) => {
    if (e.key === "Enter" && currentNumber.trim()) {
      onCall(currentNumber); // Call immediately to start call setup
      fadeAndRemove(() => {}); // Fade out independently
    }
  });

  updateDisplay();

  // Cleanup function to clear any active timers
  const cleanup = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
    }
    if (backspaceInterval) {
      clearInterval(backspaceInterval);
    }
  };

  return {
    dialerContainer,
    destroy: () => {
      cleanup();
      fadeAndRemove(() => {});
    },
  };
}

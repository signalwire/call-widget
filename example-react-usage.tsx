import * as React from "react";
import "@niravcodes/call-widget";

// Add type declaration for the custom element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "c2c-widget": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          token?: string;
          buttonId?: string;
          callDetails?: string;
        },
        HTMLElement
      >;
    }
  }
}

export function VideoCallButton() {
  const callDetails = {
    destination: "your_destination",
    supportsAudio: true,
    supportsVideo: true,
  };

  return (
    <div>
      <button id="call-button">Start Call</button>
      <c2c-widget
        token="your_token_here"
        buttonId="call-button"
        callDetails={JSON.stringify(callDetails)}
      />
    </div>
  );
}

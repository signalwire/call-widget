# Call Widget Integration Guide

This guide explains how to integrate the SignalWire call widget into your web application using either React or vanilla JavaScript.

## Installation

```bash
npm install @niravcodes/call-widget

```

## Vanilla JavaScript Usage

1. Import the widget in your HTML file:

```html
<script src="https://cdn.jsdelivr.net/npm/@niravcodes/call-widget@1.0.0/dist/c2c-widget.umd.min.js"></script>
```

or feel free to just download the widget.js file and include it in your project.

2. Add the widget to your HTML:

```html
<button id="call-button">Start Call</button>
<c2c-widget
  token="your_token_here"
  buttonId="call-button"
  callDetails='{"destination":"your_destination","supportsAudio":true,"supportsVideo":true}'
></c2c-widget>
```

## React Usage

1. Import the widget in your React component:

```tsx
import * as React from "react";
import "@niravcodes/call-widget";
```

2. Use the widget in your component:

```tsx
function VideoCallButton() {
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
```

## Configuration Options

The widget accepts the following attributes:

- `token` (required): Your authentication token
- `buttonId` (required): ID of the button element that triggers the call
- `callDetails` (required): A JSON string containing:
  - `destination`: The call destination
  - `supportsAudio`: Boolean to enable audio support
  - `supportsVideo`: Boolean to enable video support

## Notes

- Ensure you replace `your_token_here` with your actual authentication token
- The `callDetails` must be a valid JSON string
- In vanilla JavaScript, use kebab-case for attributes (e.g., `button-id` instead of `buttonId`)

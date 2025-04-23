# Call Widget Integration Guide

This guide explains how to integrate the SignalWire call widget into your web application using either React or vanilla JavaScript.

## Installation

```bash
npm install @niravcodes/call-widget

```

## Usage

```html
<c2c-widget
  buttonId="callButton"
  token="<c2c_token>"
  callDetails='{"destination":"/private/demo-1","supportsVideo":false,"supportsAudio":true}'
  collectUserDetails="false"
  survey='{"title":"Please take this survey", "description":"We would love to hear your thoughts. Would you like to take a survey?","href":"https://www.google.com"}'
  userVariables='{"user_type":"guest"}'
></c2c-widget>
```

| Parameter          | Type    | Required              | Description                                                                                                                                                  |
| ------------------ | ------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| buttonId           | string  | Yes                   | ID of the HTML button element that will trigger the call                                                                                                     |
| token              | string  | Yes                   | Authentication token for SignalWire services (either the c2c token from the dashboard, or the embed token)                                                   |
| callDetails        | object  | Yes                   | Configuration for the call including destination and media support:                                                                                          |
| collectUserDetails | boolean | No (true)             | Whether to show a form collecting user details before starting call                                                                                          |
| survey             | object  | No (false, not shown) | Post-call survey configuration:<br>- title: string - Survey modal title<br>- description: string - Survey description text<br>- href: string - URL to survey |
| userVariables      | object  | No ({})               | Custom variables to attach to the call session                                                                                                               |

### callDetails

The callDetails object is used to configure the call including destination and media support:

- destination: string - Call destination
- supportsVideo: boolean - Enable/disable video
- supportsAudio: boolean - Enable/disable audio

Strict JSON format is required for this attribute.

### survey

The survey object is used to configure the post-call survey:

- title: string - Survey modal title (optional, defaults to "Would you like to take a survey?")
- description: string - Survey description text (optional, defaults to "We would love to hear your thoughts. Would you like to take a survey? It only takes 2 minutes.")
- href: string - URL to survey (required)

Don't set this attribute if you don't want a survey to be shown.

Strict JSON format is required for this attribute.

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

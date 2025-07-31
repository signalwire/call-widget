# SignalWire Call Widget

A modern JavaScript widget that enables click-to-call functionality using the SignalWire SDK. The widget supports both outgoing and incoming calls, with a customizable UI and multiple window modes.

![screenshot of the widget](./screenshot.png)

## Installation

### NPM

```bash
npm install @signalwire/call-widget
```

### CDN (jsDelivr)

```html
<script src="https://cdn.jsdelivr.net/npm/@signalwire/call-widget@3.7.0/dist/c2c-widget-full.umd.min.js"></script>
```

## Quick Start

```html
<button id="myCallButton">Start Call</button>

<call-widget
  button-id="myCallButton"
  token="your_signalwire_token"
  destination="/private/demo"
  support-audio="true"
  support-video="true"
></call-widget>
```

## Dialer Mode

When no `destination` attribute is provided, the widget automatically displays a dialer UI, allowing users to enter phone numbers or SIP addresses:

```html
<button id="dialerButton">Open Dialer</button>

<call-widget
  button-id="dialerButton"
  token="your_signalwire_token"
  support-audio="true"
></call-widget>
```

## Attributes Reference

| Attribute            | Required | Default            | Description                                           |
| -------------------- | -------- | ------------------ | ----------------------------------------------------- |
| token                | Yes      | -                  | SignalWire authentication token                       |
| button-id            | Yes      | -                  | ID of the button that triggers the call               |
| destination          | No       | -                  | Call destination path (if not provided, dialer opens) |
| support-audio        | No       | false              | Enable audio support                                  |
| support-video        | No       | false              | Enable video support                                  |
| window-mode          | No       | "video+transcript" | UI mode for the call window                           |
| log-level            | No       | "error"            | Logging verbosity level                               |
| debug-ws-traffic     | No       | false              | Enable WebSocket traffic debugging                    |
| host                 | No       | -                  | SignalWire server host                                |
| receive-calls        | No       | false              | Enable incoming call reception                        |
| auto-answer          | No       | false              | Automatically answer incoming calls without prompt    |
| audio-codec          | No       | -                  | Comma-separated list of preferred audio codecs        |
| user-variables       | No       | -                  | Custom variables passed as JSON string                |
| background-image     | No       | default            | Background image URL for the call interface           |
| background-thumbnail | No       | default            | Background thumbnail for loading states               |

## Detailed Attribute Description

### Required Attributes

#### `token`

Your SignalWire authentication token. This is required for establishing connections. You can use C2C tokens, embed tokens, or any Call Fabric authentication token with necessary permissions.

Example:

```html
<call-widget token="your_signalwire_token"></call-widget>
```

#### `button-id`

The ID of the HTML button element that will trigger the call. The widget will wait for the button to be created if it doesn't exist at initialization time.

Example:

```html
<button id="callButton">Call Now</button>
<call-widget button-id="callButton"></call-widget>
```

### Optional Attributes

#### `destination`

The destination path for the call, usually in the format "/private/room-name". If not provided, a dialer UI will automatically appear allowing users to enter phone numbers or SIP addresses.

Example:

```html
<!-- Fixed destination -->
<call-widget destination="/private/demo-room"></call-widget>

<!-- No destination - dialer will appear -->
<call-widget token="your_token" button-id="dialButton"></call-widget>
```

#### `window-mode`

Controls the layout and features of the call window. Available options:

- `video+transcript`: Video call with transcript (default)
- `video`: Video-only interface
- `audio+transcript`: Audio call with transcript

Example:

```html
<call-widget window-mode="video+transcript"></call-widget>
```

#### `log-level`

Sets the logging verbosity. Available options:

- `debug`: Most verbose, includes all logs
- `info`: General information and important events
- `warn`: Warnings and non-critical issues
- `error`: Only error messages (default)

Example:

```html
<call-widget log-level="debug"></call-widget>
```

#### `user-variables`

Custom variables passed as a JSON string. All values must be strings. These variables are attached to the call session and can be accessed on the SignalWire side.

Example:

```html
<call-widget
  user-variables='{"customerName": "John", "accountId": "123"}'
></call-widget>
```

#### `audio-codec`

Comma-separated list of preferred audio codecs.

Example:

```html
<call-widget audio-codec="opus,PCMU"></call-widget>
```

#### `background-image`

Custom background image URL for the call interface.

Example:

```html
<call-widget
  background-image="https://example.com/background.jpg"
></call-widget>
```

## Usage Examples

### Basic Audio-Only Call Widget

```html
<button id="audioCall">Start Audio Call</button>

<call-widget
  button-id="audioCall"
  token="your_token"
  destination="/private/audio-room"
  support-audio="true"
  support-video="false"
  window-mode="audio+transcript"
></call-widget>
```

### Video Call with Transcription

```html
<button id="videoCall">Start Video Call</button>

<call-widget
  button-id="videoCall"
  token="your_token"
  destination="/private/video-room"
  support-audio="true"
  support-video="true"
  window-mode="video+transcript"
  log-level="info"
></call-widget>
```

### Dialer Widget (No Fixed Destination)

```html
<button id="dialerCall">Open Dialer</button>

<call-widget
  button-id="dialerCall"
  token="your_token"
  support-audio="true"
  support-video="true"
  window-mode="video+transcript"
  user-variables='{"source": "website"}'
></call-widget>
```

### Call Center Agent Setup

```html
<button id="agentConsole">Open Agent Console</button>

<call-widget
  button-id="agentConsole"
  token="your_token"
  destination="/private/agent-room"
  support-audio="true"
  support-video="true"
  receive-calls="true"
  auto-answer="false"
  window-mode="video+transcript"
  user-variables='{"agentId": "agent123", "department": "support"}'
></call-widget>
```

## Handling Incoming Calls

The widget supports robust incoming call functionality, making it suitable for call center and customer service applications.

### Setting Up Incoming Calls

To enable incoming calls, set the `receive-calls` attribute to "true". You can also configure automatic answer behavior using `auto-answer`.

```html
<call-widget
  button-id="agentConsole"
  token="your_token"
  destination="/private/agent-room"
  receive-calls="true"
  auto-answer="false"
  window-mode="video+transcript"
></call-widget>
```

### Incoming Call Behavior

When `receive-calls` is enabled:

1. The widget listens for incoming calls to the specified destination
2. When a call arrives:
   - If `auto-answer="true"`: The call is automatically answered
   - If `auto-answer="false"`: A notification appears allowing the user to accept or decline
3. The call window opens in the specified `window-mode` once the call is accepted

## Events

### `beforecall`

This event is triggered when the call is about to start.

```javascript
const widget = document.querySelector("call-widget");
widget.addEventListener("beforecall", () => {
  console.log("Call is about to start");
});
```

### `beforeDial`

This event is triggered before the call is actually dialed, allowing you to approve or reject the call attempt. This is useful for implementing custom authorization or confirmation dialogs.

```javascript
const widget = document.querySelector("call-widget");
widget.addEventListener("beforeDial", (event) => {
  // Mark that you have a listener (prevents auto-approval)
  event.detail.hasListeners = true;

  // Example: Show confirmation dialog
  const shouldProceed = confirm("Are you sure you want to make this call?");

  if (shouldProceed) {
    event.detail.approve(); // Proceed with the call
  } else {
    event.detail.reject(); // Cancel the call
  }
});
```

### `call.joined`

Triggered when the call is successfully joined.

```javascript
widget.addEventListener("call.joined", (event) => {
  console.log("Call joined", event.detail);
});
```

### `call.left`

Triggered when the call ends.

```javascript
widget.addEventListener("call.left", (event) => {
  console.log("Call ended", event.detail);
});
```

### `call.incoming`

Triggered when an incoming call is received (only when `receive-calls="true"`).

```javascript
widget.addEventListener("call.incoming", (event) => {
  console.log("Incoming call from:", event.detail.caller);
});
```

### `calling.user_event`

Triggered when custom user events are received during the call.

```javascript
widget.addEventListener("calling.user_event", (event) => {
  console.log("User event received:", event.detail);
});
```

## JavaScript API

### Adding User Variables Dynamically

You can add or update user variables programmatically:

```javascript
const widget = document.querySelector("call-widget");
widget.newCallVariable({
  customerID: "12345",
  priority: "high",
});
```

## Notes and Best Practices

1. **Token Security**: Never hardcode your SignalWire token in the HTML. Instead, fetch it dynamically from your server. However, you're free to use click-to-call tokens (`c2c_...`) statically in HTML.

2. **Button Placement**: The trigger button can be styled and positioned anywhere in your layout. Just ensure the `button-id` matches.

3. **Window Mode vs Media Support**:

   - `window-mode` controls the layout UI of the widget (purely cosmetic)
   - `support-audio` and `support-video` control the actual media features (webcam/microphone usage)

4. **Dialer Mode**: When no `destination` is provided, the widget automatically shows a modern dialer interface allowing users to enter phone numbers, SIP addresses, or other destinations.

5. **Responsive Design**: The widget automatically adapts to different screen sizes and orientations.

6. **Best Practices for Incoming Calls**:

   - Use `auto-answer="false"` for agent interfaces where call screening is needed
   - Use `auto-answer="true"` for automated services or IVR systems
   - For agent interfaces, `video+transcript` mode provides the most comprehensive call handling experience

7. **Call Control**: Use the `beforeDial` event to implement custom authorization, confirmation dialogs, or call screening before calls are initiated.

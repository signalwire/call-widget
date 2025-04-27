# Introduction to the Call Widget

The Call Widget is a Click-to-Call style JavaScript widget which uses the SignalWire SDK and the SignalWire
C2C service to allow you to embed calls in your website.

![screenshot of the widget](./screenshot.png)

## Installation

Import the widget from the CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/@niravcodes/call-widget/dist/c2c-widget-full.umd.min.js"></script>
```

or install the widget using npm:

```bash
npm install @niravcodes/call-widget
```

## Usage

```html
<style>
  /* This class will be removed from button when the widget fully loads. */
  .demo-button-disabled {
    opacity: 0.7;
    pointer-events: none;
  }
</style>

<!-- Button that triggers the call, wherever in the html -->
<button id="callButton" class="demo-button-disabled">Call</button>

<!-- end of body -->
<c2c-widget
  buttonId="callButton"
  token="<c2c_token or embeds_token>"
  callDetails='{"destination":"/private/demo-1","supportsVideo":false,"supportsAudio":true}'
  collectUserDetails="false"
  survey='{"title":"Please take this survey", "description":"We would love to hear your thoughts. Would you like to take a survey?","href":"https://www.google.com"}'
  userVariables='{"user_type":"guest"}'
></c2c-widget>

<script src="https://cdn.jsdelivr.net/npm/@niravcodes/call-widget/dist/c2c-widget-full.umd.min.js"></script>
```

## Parameters

| Parameter            | Type    | Required | Default   | Description                                                 |
| -------------------- | ------- | -------- | --------- | ----------------------------------------------------------- |
| [buttonId]           | string  | Yes      | -         | ID for Button that triggers call                            |
| [token]              | string  | Yes      | -         | Authentication token (c2c or embeds)                        |
| [callDetails]        | object  | Yes      | -         | Call configuration JSON                                     |
| [collectUserDetails] | boolean | No       | true      | Show user details form boolean                              |
| [survey]             | object  | No       | not shown | Post-call survey config JSON                                |
| [userVariables]      | object  | No       | {}        | Custom call variables JSON (arbitrary JSON key:value pairs) |

[buttonId]: #buttonid
[token]: #token
[callDetails]: #calldetails
[collectUserDetails]: #collectuserdetails
[survey]: #survey
[userVariables]: #uservariables

### `buttonId`

The `buttonId` attribute is used to specify the ID of the HTML button element that will trigger the call.

If the button is not found, the widget will **wait** for the button to be created. (The button doesn't have to exist in the DOM at the time of widget initialization.)

You can use the class `.demo-button-disabled` to disable the button while the widget is loading. The widget will remove that particular
class once it loads.

```html
<style>
  /* This class will be removed from button when the widget loads.
   */
  .demo-button-disabled {
    opacity: 0.7;
    pointer-events: none;
  }
</style>
```

### `token`

Authentication token for SignalWire services (either the c2c token from the dashboard, or the embed token).

Using C2C token is getting recommended for most cases. You can get the C2C token from the SignalWire Space dashboard.
You can get the embed token using the [Embeds Token](https://developer.signalwire.com/rest/signalwire-rest/endpoints/fabric/embeds-tokens) API.

You can also use any token received from the Call Fabric authentication, assuming it has the necessary permissions to the address.

### `callDetails`

The `callDetails` object is used to configure the call including destination and media support:

- `destination`: string - Call destination
- `supportsVideo`: boolean - Enable/disable video
- `supportsAudio`: boolean - Enable/disable audio

Strict JSON format is required for this attribute.

### `collectUserDetails`

Whether to show a form collecting user details before starting call.

### `survey`

The survey object is used to configure the post-call survey:

- `title`: string - Survey modal title (optional, defaults to "Would you like to take a survey?")
- `description`: string - Survey description text (optional, defaults to "We would love to hear your thoughts. Would you like to take a survey? It only takes 2 minutes.")
- `href`: string - URL to survey (required)

Don't set this attribute if you don't want a survey to be shown.

Strict JSON format is required for this attribute.

### `userVariables`

Custom variables to attach to the call session. Can be any JSON key:value pair. The following will be overridden by the widget, however:

```
callOriginHref - the URL of the page where the widget is hosted
userName - the name of the user (if they input it in the form)
userEmail - the email of the user (if they input it in the form)
userPhone - the phone number of the user (if they input it in the form)
```

Strict JSON format is required for this attribute.

## Events

### `beforecall`

This event is triggered when the call is about to start.

```javascript
const widget = document.querySelector("c2c-widget");
widget.addEventListener("beforecall", () => {
  console.log("beforecall");
});
```

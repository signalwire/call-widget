# call-context



<!-- Auto Generated Below -->


## Properties

| Property                   | Attribute              | Description | Type                                                            | Default     |
| -------------------------- | ---------------------- | ----------- | --------------------------------------------------------------- | ----------- |
| `audio`                    | `audio`                |             | `boolean`                                                       | `true`      |
| `audioCodecs`              | `audio-codecs`         |             | `string`                                                        | `undefined` |
| `debugLogWsTraffic`        | `debug-log-ws-traffic` |             | `boolean`                                                       | `undefined` |
| `destination` _(required)_ | `destination`          |             | `string`                                                        | `undefined` |
| `host`                     | `host`                 |             | `string`                                                        | `undefined` |
| `logLevel`                 | `log-level`            |             | `"debug" \| "error" \| "info" \| "silent" \| "trace" \| "warn"` | `'info'`    |
| `token` _(required)_       | `token`                |             | `string`                                                        | `undefined` |
| `userVariables`            | `user-variables`       |             | `string`                                                        | `'{}'`      |
| `video`                    | `video`                |             | `boolean`                                                       | `false`     |


## Events

| Event                | Description | Type                                    |
| -------------------- | ----------- | --------------------------------------- |
| `callEnded`          |             | `CustomEvent<void>`                     |
| `callStarted`        |             | `CustomEvent<void>`                     |
| `clientIncomingCall` |             | `CustomEvent<IncomingCallNotification>` |
| `clientReady`        |             | `CustomEvent<any>`                      |


## Methods

### `dial() => Promise<any>`



#### Returns

Type: `Promise<any>`




----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*

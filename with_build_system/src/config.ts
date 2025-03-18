export const CONFIG = {
  // Guest restricted token
  TOKEN: process.env.PUBLIC_SW_TOKEN,
  DEBUG: {
    logWsTraffic: false,
  },

  ENDPOINTS: {
    "demo-1": {
      path: "/private/demo-1",
      supportsVideo: true,
      supportsAudio: true,
    },
    "demo-2": {
      path: "/private/demo-2",
      supportsVideo: false,
      supportsAudio: true,
    },
    "demo-3": {
      path: "/private/demo-3",
      supportsVideo: false,
      supportsAudio: true,
    },
    "demo-4": {
      path: "/private/demo-4",
      supportsVideo: false,
      supportsAudio: true,
    },
  },
};

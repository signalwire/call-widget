import { SignalWireClientParams } from "@signalwire/js";

type AttributeDefinition<T> = {
  name: string;
  parser: (value: string) => T;
  required: boolean;
};

type Window = "video+transcript" | "video" | "audio+transcript";

export class CallWidgetConfig {
  private widget: HTMLElement;

  private static readonly DEFAULT_BACKGROUND_IMAGE =
    "https://developer.signalwire.com/img/call-widget/sw_background.webp";
  private static readonly DEFAULT_BACKGROUND_THUMBNAIL =
    "data:image/webp;base64,UklGRv4BAABXRUJQVlA4IPIBAAAQDgCdASpkADgAPm0wlEgkIqIlpvVbQLANiWUIcAF/N0SNSoFwLlO5RP2YPzaIbnj2FRb+bYMVMO2hQaOhoOYVcYas+y/tUm1/zmSSq5AUjQJ+cqL2Z4Z7qXLgXDAOWYT82r5bm+2mFDM38Q0ruBiEoVE+LSAJdoHQAP7gQtoYHET/VcymFbJngGPQnLANH4pBKeNTCNh83JD/q72P9SVEf91Mx4GHZGI07V8EIhDuJRWajJcwkrY9epV7HluQk5qhMElwzHER6a3Zc/OaBy35/gKiNW/4Wd0oEovwE2r9jyX1HImaWtlcTNyPPjyqvi7m5rKNN82p/S01kcM9spuizE4Pba01gNXE5vPW68xKBA/5rLkd/4UosKilKe9PXgPgEgNiTV8tlHZ33yDJQSojodoGsBvOsVgYm06hOx2FqbPFSVY/2mjEsBcCuGQAy1+sBIt2FygUENMwQ4jSOFHEQZ7C9Sc/t1gIlR2bZtNtp1BWIQW/Iu6DDMwjSSTX4qjCwnN6/sqzlv0ZFBAKVIX4uy9DbwSWFKGKqDlsrbAmVFaioKHX3IX/Xm49jyIK7/0PIre8rpPO7DBAX5JbGQCYg8mbG2uf5xTT1gAWy0N4hyjd8bt6FFnL6eUOrt6Hjzy5gP+/8lb0glwD14Mjd9AAAAA=";

  constructor(widget: HTMLElement) {
    this.widget = widget;
  }

  private static attributeDefinitions = {
    userVariables: {
      name: "user-variables",
      parser: (value: string): Record<string, string> => {
        const parsed = JSON.parse(value);
        if (typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("Must be a JSON object with string values");
        }
        for (const [_, val] of Object.entries(parsed)) {
          if (typeof val !== "string") {
            throw new Error("All values must be strings");
          }
        }
        return parsed;
      },
      required: false,
    },
    audioCodec: {
      name: "audio-codec",
      parser: (value: string): string[] => {
        const codecs = value.split(",").map((codec) => codec.trim());
        if (codecs.some((codec) => !codec)) {
          throw new Error("Codecs cannot be empty strings");
        }
        return codecs;
      },
      required: false,
    },
    destination: {
      name: "destination",
      parser: (value: string): string => {
        if (!value.trim()) {
          throw new Error("Destination cannot be empty");
        }
        return value;
      },
      required: false,
    },
    supportAudio: {
      name: "support-audio",
      parser: (value: string): boolean => {
        const normalized = value.toLowerCase();
        if (normalized !== "true" && normalized !== "false") {
          throw new Error('Must be "true" or "false"');
        }
        return normalized === "true";
      },
      required: false,
    },
    supportVideo: {
      name: "support-video",
      parser: (value: string): boolean => {
        const normalized = value.toLowerCase();
        if (normalized !== "true" && normalized !== "false") {
          throw new Error('Must be "true" or "false"');
        }
        return normalized === "true";
      },
      required: false,
    },
    token: {
      name: "token",
      parser: (value: string): string => {
        if (!value.trim()) {
          throw new Error("Token cannot be empty");
        }
        return value;
      },
      required: true,
    },
    logLevel: {
      name: "log-level",
      parser: (value: string): SignalWireClientParams["logLevel"] => {
        const validLevels = ["debug", "info", "warn", "error"];
        if (!validLevels.includes(value.toLowerCase())) {
          throw new Error(
            `Invalid log level. Must be one of: ${validLevels.join(", ")}`
          );
        }
        return value as SignalWireClientParams["logLevel"];
      },
      required: false,
    },
    debugWsTraffic: {
      name: "debug-ws-traffic",
      parser: (value: string): boolean => {
        const normalized = value.toLowerCase();
        if (normalized !== "true" && normalized !== "false") {
          throw new Error('Must be "true" or "false"');
        }
        return normalized === "true";
      },
      required: false,
    },
    host: {
      name: "host",
      parser: (value: string): string => {
        if (!value.trim()) {
          throw new Error("Host cannot be empty");
        }
        try {
          new URL(`https://${value}`);
        } catch {
          throw new Error("Invalid host format");
        }
        return value;
      },
      required: false,
    },
    windowMode: {
      name: "window-mode",
      parser: (value: string): Window => {
        const validModes = [
          "video+transcript",
          "video",
          "audio+transcript",
        ] as const;
        const mode = value.trim() as Window;
        if (!validModes.includes(mode)) {
          throw new Error(
            `Invalid window mode. Must be one of: ${validModes.join(", ")}`
          );
        }
        return mode;
      },
      required: false,
    },
    backgroundImage: {
      name: "background-image",
      parser: (value: string): string => {
        if (!value.trim()) {
          throw new Error("Background image URL cannot be empty");
        }
        try {
          new URL(value);
        } catch {
          throw new Error("Invalid background image URL format");
        }
        return value;
      },
      required: false,
    },
    backgroundThumbnail: {
      name: "background-thumbnail",
      parser: (value: string): string => {
        if (!value.trim()) {
          throw new Error("Background thumbnail cannot be empty");
        }
        return value;
      },
      required: false,
    },
    receiveCalls: {
      name: "receive-calls",
      parser: (value: string): boolean => {
        const normalized = value.toLowerCase();
        if (normalized !== "true" && normalized !== "false") {
          throw new Error('Must be "true" or "false"');
        }
        return normalized === "true";
      },
      required: false,
    },
    autoAnswer: {
      name: "auto-answer",
      parser: (value: string): boolean => {
        const normalized = value.toLowerCase();
        if (normalized !== "true" && normalized !== "false") {
          throw new Error('Must be "true" or "false"');
        }
        return normalized === "true";
      },
      required: false,
    },
  } as const;

  getAttribute<T>(definition: AttributeDefinition<T>): T {
    const value = this.widget.getAttribute(definition.name);

    if (value === null) {
      if (definition.required) {
        throw new Error(`Required attribute "${definition.name}" is missing`);
      }
      return null as T;
    }

    try {
      return definition.parser(value);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to parse attribute "${definition.name}": ${error.message}`
        );
      }
      throw error;
    }
  }

  getReceiveCalls(): boolean | null {
    return this.getAttribute(
      CallWidgetConfig.attributeDefinitions.receiveCalls
    );
  }

  getAutoAnswer(): boolean | null {
    return this.getAttribute(CallWidgetConfig.attributeDefinitions.autoAnswer);
  }

  getWindowMode(): Window | null {
    return this.getAttribute(CallWidgetConfig.attributeDefinitions.windowMode);
  }

  getHost(): string | null {
    return this.getAttribute(CallWidgetConfig.attributeDefinitions.host);
  }

  getDebugMode(): SignalWireClientParams["logLevel"] | null {
    return this.getAttribute(CallWidgetConfig.attributeDefinitions.logLevel);
  }

  getDebugWsTraffic(): boolean | null {
    return this.getAttribute(
      CallWidgetConfig.attributeDefinitions.debugWsTraffic
    );
  }

  getUserVariables(): Record<string, string> | null {
    return this.getAttribute(
      CallWidgetConfig.attributeDefinitions.userVariables
    );
  }

  getAudioCodec(): string[] | null {
    return this.getAttribute(CallWidgetConfig.attributeDefinitions.audioCodec);
  }

  getDestination(): string | null {
    return this.getAttribute(CallWidgetConfig.attributeDefinitions.destination);
  }

  getSupportAudio(): boolean | null {
    return this.getAttribute(
      CallWidgetConfig.attributeDefinitions.supportAudio
    );
  }

  getSupportVideo(): boolean | null {
    return this.getAttribute(
      CallWidgetConfig.attributeDefinitions.supportVideo
    );
  }

  getToken(): string {
    return this.getAttribute(CallWidgetConfig.attributeDefinitions.token);
  }

  getBackgroundImage(): string {
    return (
      this.getAttribute(
        CallWidgetConfig.attributeDefinitions.backgroundImage
      ) ?? CallWidgetConfig.DEFAULT_BACKGROUND_IMAGE
    );
  }

  getBackgroundThumbnail(): string {
    return (
      this.getAttribute(
        CallWidgetConfig.attributeDefinitions.backgroundThumbnail
      ) ?? CallWidgetConfig.DEFAULT_BACKGROUND_THUMBNAIL
    );
  }
}

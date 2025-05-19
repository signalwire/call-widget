import { SignalWireClientParams } from "@signalwire/js";

type AttributeDefinition<T> = {
  name: string;
  parser: (value: string) => T;
  required: boolean;
};

type Window = "video+transcript" | "video" | "audio+transcript";

export class CallWidgetConfig {
  private widget: HTMLElement;

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
      required: true,
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

  getDestination(): string {
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
}

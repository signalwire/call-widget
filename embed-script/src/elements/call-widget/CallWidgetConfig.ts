type AttributeDefinition<T> = {
  name: string;
  parser: (value: string) => T;
  required: boolean;
};

export class CallWidgetConfig {
  private widget: HTMLElement;

  constructor(widget: HTMLElement) {
    this.widget = widget;
  }

  private static attributeDefinitions = {
    userVariables: {
      name: "user-variables",
      parser: (value: string): Record<string, string> => JSON.parse(value),
      required: false,
    },
    audioCodec: {
      name: "audio-codec",
      parser: (value: string): string[] =>
        value.split(",").map((codec) => codec.trim()),
      required: false,
    },
    destination: {
      name: "destination",
      parser: (value: string): string => value,
      required: true,
    },
    supportAudio: {
      name: "support-audio",
      parser: (value: string): boolean => value.toLowerCase() === "true",
      required: false,
    },
    supportVideo: {
      name: "support-video",
      parser: (value: string): boolean => value.toLowerCase() === "true",
      required: false,
    },
    token: {
      name: "token",
      parser: (value: string): string => value,
      required: true,
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

interface StoredDeviceInfo {
  deviceId: string;
  label: string;
  groupId?: string;
  kind: string;
  timestamp: number;
}

interface DevicePreferences {
  microphone?: StoredDeviceInfo;
  camera?: StoredDeviceInfo;
  speaker?: StoredDeviceInfo;
}

export class DevicePersistence {
  private static readonly STORAGE_KEY = "signalwire_device_preferences";
  private static readonly MAX_AGE_DAYS = 30;
  private static readonly DEVICE_TYPE_MAP = {
    microphone: "audioinput" as const,
    camera: "videoinput" as const,
    speaker: "audiooutput" as const,
  };

  static saveDeviceSelection(
    deviceType: keyof typeof DevicePersistence.DEVICE_TYPE_MAP,
    device: MediaDeviceInfo
  ): void {
    try {
      const preferences = this.loadPreferences();

      preferences[deviceType] = {
        deviceId: device.deviceId,
        label: device.label,
        groupId: device.groupId,
        kind: device.kind,
        timestamp: Date.now(),
      };

      this.savePreferences(preferences);
    } catch (error) {
      console.warn(
        `DevicePersistence: Failed to save ${deviceType} selection:`,
        error
      );
    }
  }

  static findBestMatch(
    deviceType: keyof typeof DevicePersistence.DEVICE_TYPE_MAP,
    availableDevices: MediaDeviceInfo[]
  ): MediaDeviceInfo | null {
    try {
      const preferences = this.loadPreferences();
      const storedDevice = preferences[deviceType];

      if (!storedDevice || this.isExpired(storedDevice)) {
        return null;
      }

      const expectedKind = this.DEVICE_TYPE_MAP[deviceType];
      const candidateDevices = availableDevices.filter(
        (d) => d.kind === expectedKind
      );

      if (candidateDevices.length === 0) {
        return null;
      }

      return this.matchDevice(storedDevice, candidateDevices);
    } catch (error) {
      console.warn(
        `DevicePersistence: Failed to find best match for ${deviceType}:`,
        error
      );
      return null;
    }
  }

  private static matchDevice(
    storedDevice: StoredDeviceInfo,
    availableDevices: MediaDeviceInfo[]
  ): MediaDeviceInfo | null {
    // Strategy 1: Exact deviceId match (most reliable)
    let match = availableDevices.find(
      (d) => d.deviceId === storedDevice.deviceId
    );
    if (match) {
      return match;
    }

    // Strategy 2: Exact label and kind match
    if (this.isValidString(storedDevice.label)) {
      match = availableDevices.find(
        (d) => d.label === storedDevice.label && d.kind === storedDevice.kind
      );
      if (match) {
        return match;
      }
    }

    // Strategy 3: GroupId match (same physical device, different session)
    if (this.isValidString(storedDevice.groupId)) {
      match = availableDevices.find(
        (d) =>
          d.groupId === storedDevice.groupId && d.kind === storedDevice.kind
      );
      if (match) {
        return match;
      }
    }

    // Strategy 4: Fuzzy label matching (normalized comparison)
    if (this.isValidString(storedDevice.label)) {
      const normalizedStoredLabel = this.normalizeDeviceLabel(
        storedDevice.label
      );
      match = availableDevices.find((d) => {
        if (!this.isValidString(d.label)) return false;
        const normalizedCurrentLabel = this.normalizeDeviceLabel(d.label);
        return (
          normalizedStoredLabel === normalizedCurrentLabel &&
          d.kind === storedDevice.kind
        );
      });
      if (match) {
        return match;
      }
    }

    return null;
  }

  private static normalizeDeviceLabel(label: string): string {
    return label
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/[()[\]{}]/g, "")
      .replace(/\b(default|built-in)\b/gi, "")
      .trim();
  }

  private static isValidString(value: string | undefined): boolean {
    return typeof value === "string" && value.length > 0 && value !== "default";
  }

  private static loadPreferences(): DevicePreferences {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return {};
      }

      const preferences = JSON.parse(stored) as DevicePreferences;

      // Clean up expired entries
      this.cleanupExpiredEntries(preferences);

      return preferences;
    } catch (error) {
      console.warn("DevicePersistence: Failed to load preferences:", error);
      return {};
    }
  }

  private static savePreferences(preferences: DevicePreferences): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.warn("DevicePersistence: Failed to save preferences:", error);
      throw error;
    }
  }

  private static cleanupExpiredEntries(preferences: DevicePreferences): void {
    const now = Date.now();
    const maxAge = this.MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

    (Object.keys(preferences) as Array<keyof DevicePreferences>).forEach(
      (key) => {
        const device = preferences[key];
        if (device && now - device.timestamp > maxAge) {
          delete preferences[key];
        }
      }
    );
  }

  private static isExpired(storedDevice: StoredDeviceInfo): boolean {
    const maxAge = this.MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
    return Date.now() - storedDevice.timestamp > maxAge;
  }

  static clearPreferences(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn("DevicePersistence: Failed to clear preferences:", error);
    }
  }

  static getStoredDeviceInfo(): {
    hasStoredMicrophone: boolean;
    hasStoredCamera: boolean;
    hasStoredSpeaker: boolean;
    microphoneLabel?: string;
    cameraLabel?: string;
    speakerLabel?: string;
    lastUpdated?: number;
  } {
    try {
      const preferences = this.loadPreferences();
      return {
        hasStoredMicrophone: !!preferences.microphone,
        hasStoredCamera: !!preferences.camera,
        hasStoredSpeaker: !!preferences.speaker,
        microphoneLabel: preferences.microphone?.label,
        cameraLabel: preferences.camera?.label,
        speakerLabel: preferences.speaker?.label,
        lastUpdated:
          Math.max(
            preferences.microphone?.timestamp || 0,
            preferences.camera?.timestamp || 0,
            preferences.speaker?.timestamp || 0
          ) || undefined,
      };
    } catch (error) {
      console.warn(
        "DevicePersistence: Failed to get stored device info:",
        error
      );
      return {
        hasStoredMicrophone: false,
        hasStoredCamera: false,
        hasStoredSpeaker: false,
      };
    }
  }
}

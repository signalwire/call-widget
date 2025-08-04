import { FabricRoomSession, WebRTC } from "@signalwire/js";
import { DevicePersistence } from "./DevicePersistence";

class DevicesState {
  devices: MediaDeviceInfo[] = [];
  loading: boolean = false;
  selectedMicrophone: MediaDeviceInfo | null = null;
  selectedCamera: MediaDeviceInfo | null = null;
  selectedSpeaker: MediaDeviceInfo | null = null;
  isAudioMuted: boolean = false;
  isVideoMuted: boolean = false;
  isSpeakerMuted: boolean = false;
  currentVideoAspectRatio: number | null = null;

  get audioinput() {
    return this.devices.filter((d) => d.kind === "audioinput");
  }

  get audiooutput() {
    return this.devices.filter((d) => d.kind === "audiooutput");
  }

  get videoinput() {
    return this.devices.filter((d) => d.kind === "videoinput");
  }
}

// usage:

// const devices = new Devices();
// devices.getPermissions();
// initialize call
// devices.setup(call);

class Devices {
  private static instance: Devices;
  state: DevicesState = new DevicesState();
  call: FabricRoomSession | null = null;
  private deviceWatcher: any = null;
  private permissionStream: MediaStream | null = null;

  private constructor() {}

  static getInstance(): Devices {
    if (!Devices.instance) {
      Devices.instance = new Devices();
    }
    return Devices.instance;
  }

  async getPermissions(video: boolean = true) {
    try {
      const stream = await WebRTC.getUserMedia({
        audio: true,
        video,
      });

      if (this.permissionStream) {
        this.permissionStream.getTracks().forEach((track) => track.stop());
      }
      this.permissionStream = stream;

      return { success: true };
    } catch (error) {
      console.error("Error getting permissions:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to get device permissions",
      };
    }
  }

  async setup(call: FabricRoomSession) {
    if (this.permissionStream) {
      this.permissionStream.getTracks().forEach((track) => track.stop());
      this.permissionStream = null;
    }

    this.state.loading = true;
    this.call = call;

    try {
      await this._updateDevicesList();
      await this._updateSelectedDevices();
      this.updateVideoAspectRatio();

      this.deviceWatcher = await WebRTC.createDeviceWatcher();
      this.deviceWatcher.on("changed", async () => {
        await this._updateDevicesList();
        await this._updateSelectedDevices();
        this.updateVideoAspectRatio();
        this.onChange();
      });

      this.state.loading = false;
      this.onLoad();
    } catch (error) {
      console.error("Error in setup:", error);
      this.state.loading = false;
    }
  }

  private async _updateDevicesList() {
    const devices = await WebRTC.enumerateDevices();
    this.state.devices = devices;

    // Check if we need to remute any tracks after device changes
    if (this.call) {
      if (this.state.isVideoMuted) {
        const videoTrack =
          this.call.localVideoTrack ||
          this.call.localStream?.getVideoTracks()?.[0];
        if (videoTrack) {
          videoTrack.enabled = false;
        }
      }

      if (this.state.isAudioMuted) {
        const audioTrack =
          this.call.localAudioTrack ||
          this.call.localStream?.getAudioTracks()?.[0];
        if (audioTrack) {
          audioTrack.enabled = false;
        }
      }
    }
  }

  private async _updateSelectedDevices() {
    const { audioinput, audiooutput, videoinput } = this.state;

    if (!this.state.selectedMicrophone && audioinput.length > 0) {
      this.state.selectedMicrophone =
        DevicePersistence.findBestMatch("microphone", this.state.devices) ||
        audioinput[0];
    }

    if (!this.state.selectedCamera && videoinput.length > 0) {
      this.state.selectedCamera =
        DevicePersistence.findBestMatch("camera", this.state.devices) ||
        videoinput[0];
    }

    if (!this.state.selectedSpeaker && audiooutput.length > 0) {
      this.state.selectedSpeaker =
        DevicePersistence.findBestMatch("speaker", this.state.devices) ||
        audiooutput[0];
    }

    // Ensure selected devices are still available (device might have been unplugged)
    this.state.selectedMicrophone =
      audioinput.find(
        (d) => d.deviceId === this.state.selectedMicrophone?.deviceId
      ) ||
      audioinput[0] ||
      null;

    this.state.selectedCamera =
      videoinput.find(
        (d) => d.deviceId === this.state.selectedCamera?.deviceId
      ) ||
      videoinput[0] ||
      null;

    this.state.selectedSpeaker =
      audiooutput.find(
        (d) => d.deviceId === this.state.selectedSpeaker?.deviceId
      ) ||
      audiooutput[0] ||
      null;
  }

  updateVideoAspectRatio() {
    if (!this.call?.localStream) return;

    const videoTrack = this.call.localStream.getVideoTracks()[0];
    if (!videoTrack) return;

    const settings = videoTrack.getSettings();
    const newAspectRatio =
      settings.aspectRatio ||
      (settings.width && settings.height
        ? settings.width / settings.height
        : null);

    // turns out, this aspect ratio reported by videoTrack.getSettings is not accurate (for phones, sensor aspect ratio is reported rather than the actual stream aspect ratio)
    // so we need to kind of bypass this function in `Call` class when the video metadata loads. Sorry for the hack.

    if (newAspectRatio !== this.state.currentVideoAspectRatio) {
      this.state.currentVideoAspectRatio = newAspectRatio;
      this.onAspectRatioChange(newAspectRatio ? newAspectRatio : null);
    }
  }

  // Apply saved device preferences after call is established
  async applySavedDevicePreferences(): Promise<void> {
    if (!this.call) {
      return;
    }

    // Apply saved microphone - force apply if we have a saved one
    const savedMicrophone = DevicePersistence.findBestMatch(
      "microphone",
      this.state.devices
    );

    if (savedMicrophone) {
      const callMicId = (this.call as any).microphoneId;
      const needsChange = callMicId !== savedMicrophone.deviceId;

      if (needsChange) {
        try {
          await this.call.updateMicrophone({
            deviceId: savedMicrophone.deviceId,
          });
          this.state.selectedMicrophone = savedMicrophone;
        } catch (error) {
          console.warn("Failed to apply saved microphone:", error);
        }
      }
    }

    // Apply saved camera - force apply if we have a saved one
    const savedCamera = DevicePersistence.findBestMatch(
      "camera",
      this.state.devices
    );

    if (savedCamera) {
      const callCamId = (this.call as any).cameraId;
      const needsChange = callCamId !== savedCamera.deviceId;

      if (needsChange) {
        try {
          await this.call.updateCamera({ deviceId: savedCamera.deviceId });
          this.state.selectedCamera = savedCamera;
          this.updateVideoAspectRatio();
        } catch (error) {
          console.warn("Failed to apply saved camera:", error);
        }
      }
    }

    // Apply saved speaker - always force apply since we can't check call state
    const savedSpeaker = DevicePersistence.findBestMatch(
      "speaker",
      this.state.devices
    );

    if (savedSpeaker) {
      try {
        await this.call.updateSpeaker({ deviceId: savedSpeaker.deviceId });
        this.state.selectedSpeaker = savedSpeaker;
      } catch (error) {
        console.warn("Failed to apply saved speaker:", error);
      }
    }

    // Update UI after applying preferences
    this.onChange();
  }

  // meant to be overridden
  onLoad() {}
  onChange() {}
  onAspectRatioChange(aspectRatio: number | null) {
    console.log("onAspectRatioChange", aspectRatio);
  }

  // Call this after the call is started to apply saved device preferences
  async onCallStarted(): Promise<void> {
    await this.applySavedDevicePreferences();
  }

  async updateCamera(deviceId: string): Promise<boolean> {
    const device = this.state.devices.find(
      (d) => d.deviceId === deviceId && d.kind === "videoinput"
    );
    if (!device || !this.call) return false;

    try {
      await this.call.updateCamera({ deviceId });
      this.state.selectedCamera = device;
      DevicePersistence.saveDeviceSelection("camera", device);
      this.updateVideoAspectRatio();
      this.onChange();
      return true;
    } catch (error) {
      console.error("Error updating camera:", error);
      return false;
    }
  }

  async updateMicrophone(deviceId: string): Promise<boolean> {
    const device = this.state.devices.find(
      (d) => d.deviceId === deviceId && d.kind === "audioinput"
    );
    if (!device || !this.call) return false;

    try {
      await this.call.updateMicrophone({ deviceId });
      this.state.selectedMicrophone = device;
      DevicePersistence.saveDeviceSelection("microphone", device);
      this.onChange();
      return true;
    } catch (error) {
      console.error("Error updating microphone:", error);
      return false;
    }
  }

  async updateSpeaker(deviceId: string): Promise<boolean> {
    const device = this.state.devices.find(
      (d) => d.deviceId === deviceId && d.kind === "audiooutput"
    );
    if (!device || !this.call) return false;

    try {
      await this.call.updateSpeaker({ deviceId });
      this.state.selectedSpeaker = device;
      DevicePersistence.saveDeviceSelection("speaker", device);
      this.onChange();
      return true;
    } catch (error) {
      console.error("Error updating speaker:", error);
      return false;
    }
  }

  async toggleVideo(): Promise<void> {
    if (!this.call) return;

    try {
      const self = await this.getSelf();
      if (self?.videoMuted) {
        await this.call.videoUnmute();
      } else {
        await this.call.videoMute();
      }
      this.state.isVideoMuted = !this.state.isVideoMuted;
      this.onChange();
    } catch (error) {
      console.error(
        "Failed to toggle video via call method, trying fallback:",
        error
      );

      try {
        // Try local video track
        const localTrack = this.call.localVideoTrack;
        if (localTrack) {
          localTrack.enabled = this.state.isVideoMuted;
          this.state.isVideoMuted = !this.state.isVideoMuted;
          this.onChange();
          return;
        }

        // If no local track, try stream
        const localStream = this.call.localStream;
        const videoTrack = localStream?.getVideoTracks()?.[0];
        if (videoTrack) {
          videoTrack.enabled = this.state.isVideoMuted;
          this.state.isVideoMuted = !this.state.isVideoMuted;
          this.onChange();
          return;
        }

        console.error("No video track available for fallback muting");
      } catch (fallbackError) {
        console.error(
          "Failed to toggle video via fallback method:",
          fallbackError
        );
      }
    }
  }

  async toggleAudio(): Promise<void> {
    if (!this.call) return;

    try {
      const self = await this.getSelf();
      if (self?.audioMuted) {
        await this.call.audioUnmute();
      } else {
        await this.call.audioMute();
      }
      this.state.isAudioMuted = !this.state.isAudioMuted;
      this.onChange();
    } catch (error) {
      console.error(
        "Failed to toggle audio via call method, trying fallback:",
        error
      );

      try {
        // Try local audio track
        const localTrack = this.call.localAudioTrack;
        if (localTrack) {
          localTrack.enabled = this.state.isAudioMuted;
          this.state.isAudioMuted = !this.state.isAudioMuted;
          this.onChange();
          return;
        }

        // If no local track, try stream
        const localStream = this.call.localStream;
        const audioTrack = localStream?.getAudioTracks()?.[0];
        if (audioTrack) {
          audioTrack.enabled = this.state.isAudioMuted;
          this.state.isAudioMuted = !this.state.isAudioMuted;
          this.onChange();
          return;
        }

        console.error("No audio track available for fallback muting");
      } catch (fallbackError) {
        console.error(
          "Failed to toggle audio via fallback method:",
          fallbackError
        );
      }
    }
  }

  async toggleSpeaker(): Promise<void> {
    if (!this.call) return;

    try {
      const self = await this.getSelf();
      if (self?.deaf) {
        await this.call.undeaf();
      } else {
        await this.call.deaf();
      }
      this.state.isSpeakerMuted = !this.state.isSpeakerMuted;
      this.onChange();
    } catch (error) {
      console.error(
        "Failed to toggle speaker via deaf/undeaf, trying fallback:",
        error
      );

      try {
        // @ts-ignore
        if (this.call.audioEl) {
          // @ts-ignore
          this.call.audioEl.muted = !this.state.isSpeakerMuted;
          this.state.isSpeakerMuted = !this.state.isSpeakerMuted;
          this.onChange();
        }
      } catch (fallbackError) {
        console.error(
          "Failed to toggle speaker via fallback method:",
          fallbackError
        );
      }
    }
  }

  private async getSelf() {
    if (!this.call) return null;
    const members = await this.call.getMembers();
    return members?.members.find((m) => m.id === this.call?.memberId);
  }

  clearDevicePreferences() {
    DevicePersistence.clearPreferences();
  }

  getStoredDeviceInfo() {
    return DevicePersistence.getStoredDeviceInfo();
  }

  reset() {
    if (this.deviceWatcher) {
      this.deviceWatcher.off("changed");
      this.deviceWatcher = null;
    }

    if (this.permissionStream) {
      this.permissionStream.getTracks().forEach((track) => track.stop());
      this.permissionStream = null;
    }

    if (this.call?.localStream) {
      const tracks = this.call.localStream.getTracks();
      tracks.forEach((track) => {
        track.stop();
      });
    }

    if (this.call?.localVideoTrack) {
      this.call.localVideoTrack.stop();
    }

    if (this.call?.localAudioTrack) {
      this.call.localAudioTrack.stop();
    }

    this.call = null;
    this.state = new DevicesState();
    this.onLoad = () => {};
    this.onChange = () => {};
    this.onAspectRatioChange = () => {};
  }
}

export default Devices.getInstance();

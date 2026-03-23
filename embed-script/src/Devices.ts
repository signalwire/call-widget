import { type Call as SWCall, type CallSelfParticipant } from "@signalwire/js";
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
  autoGainControl: boolean = false; // Disabled per WebRTC best practices - prevents pumping effects
  noiseSuppression: boolean = false; // Disabled per WebRTC best practices - prevents robotic voice

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

class Devices {
  private static instance: Devices;
  state: DevicesState = new DevicesState();
  call: SWCall | null = null;
  private currentSelf: CallSelfParticipant | null = null;
  private localStream: MediaStream | null = null;
  private deviceChangeHandler: (() => void) | null = null;
  private permissionStream: MediaStream | null = null;
  private callSubscriptions: { unsubscribe: () => void }[] = [];

  private constructor() {}

  static getInstance(): Devices {
    if (!Devices.instance) {
      Devices.instance = new Devices();
    }
    return Devices.instance;
  }

  async getPermissions(video: boolean = true) {
    try {
      const audioSettings = DevicePersistence.getAudioProcessingSettings();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: audioSettings.autoGainControl,
          noiseSuppression: audioSettings.noiseSuppression,
          echoCancellation: true,
        },
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

  async setup(call: SWCall) {
    if (this.permissionStream) {
      this.permissionStream.getTracks().forEach((track) => track.stop());
      this.permissionStream = null;
    }

    this.state.loading = true;
    this.call = call;

    try {
      await this._updateDevicesList();
      await this._updateSelectedDevices();

      // Track local stream for aspect ratio and cleanup
      const localStreamSub = (call as any).localStream$.subscribe(
        (stream: MediaStream | null) => {
          this.localStream = stream;
          if (stream) {
            this.updateVideoAspectRatio(stream);
          }
        }
      );
      this.callSubscriptions.push(localStreamSub);

      // Track self participant for mute/device controls
      const selfSub = (call as any).self$.subscribe((self: any) => {
        if (!self) return;
        this.currentSelf = self;

        this.state.isAudioMuted = self.audioMuted ?? false;
        this.state.isVideoMuted = self.videoMuted ?? false;
        this.state.isSpeakerMuted = self.deaf ?? false;

        self.audioMuted$?.subscribe((muted: boolean) => {
          this.state.isAudioMuted = muted;
          this.onChange();
        });
        self.videoMuted$?.subscribe((muted: boolean) => {
          this.state.isVideoMuted = muted;
          this.onChange();
        });
        self.deaf$?.subscribe((deaf: boolean) => {
          this.state.isSpeakerMuted = deaf;
          this.onChange();
        });

        this.onChange();
      });
      this.callSubscriptions.push(selfSub);

      // Watch for device changes
      this.deviceChangeHandler = async () => {
        await this._updateDevicesList();
        await this._updateSelectedDevices();
        this.onChange();
      };
      navigator.mediaDevices.addEventListener(
        "devicechange",
        this.deviceChangeHandler
      );

      this.state.loading = false;
      this.onLoad();
    } catch (error) {
      console.error("Error in setup:", error);
      this.state.loading = false;
    }
  }

  private async _updateDevicesList() {
    this.state.devices = await navigator.mediaDevices.enumerateDevices();
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

    const audioSettings = DevicePersistence.getAudioProcessingSettings();
    this.state.autoGainControl = audioSettings.autoGainControl;
    this.state.noiseSuppression = audioSettings.noiseSuppression;

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

  updateVideoAspectRatio(stream?: MediaStream) {
    const localStream = stream || this.localStream;
    if (!localStream) return;

    const videoTrack = localStream.getVideoTracks()[0];
    if (!videoTrack) return;

    const settings = videoTrack.getSettings();
    const newAspectRatio =
      settings.aspectRatio ||
      (settings.width && settings.height
        ? settings.width / settings.height
        : null);

    if (newAspectRatio !== this.state.currentVideoAspectRatio) {
      this.state.currentVideoAspectRatio = newAspectRatio;
      this.onAspectRatioChange(newAspectRatio ? newAspectRatio : null);
    }
  }

  async applySavedDevicePreferences(): Promise<void> {
    if (!this.currentSelf) return;

    const savedMicrophone = DevicePersistence.findBestMatch(
      "microphone",
      this.state.devices
    );
    if (savedMicrophone) {
      try {
        this.currentSelf.selectAudioInputDevice(savedMicrophone);
        this.state.selectedMicrophone = savedMicrophone;
      } catch (error) {
        console.warn("Failed to apply saved microphone:", error);
      }
    }

    const savedCamera = DevicePersistence.findBestMatch(
      "camera",
      this.state.devices
    );
    if (savedCamera) {
      try {
        this.currentSelf.selectVideoInputDevice(savedCamera);
        this.state.selectedCamera = savedCamera;
        if (this.localStream) this.updateVideoAspectRatio(this.localStream);
      } catch (error) {
        console.warn("Failed to apply saved camera:", error);
      }
    }

    this.onChange();
  }

  // meant to be overridden
  onLoad() {}
  onChange() {}
  onAspectRatioChange(aspectRatio: number | null) {
    console.log("onAspectRatioChange", aspectRatio);
  }

  async onCallStarted(): Promise<void> {
    await this.applySavedDevicePreferences();
  }

  async updateCamera(deviceId: string): Promise<boolean> {
    const device = this.state.devices.find(
      (d) => d.deviceId === deviceId && d.kind === "videoinput"
    );
    if (!device || !this.currentSelf) return false;

    try {
      this.currentSelf.selectVideoInputDevice(device);
      this.state.selectedCamera = device;
      DevicePersistence.saveDeviceSelection("camera", device);
      if (this.localStream) this.updateVideoAspectRatio(this.localStream);
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
    if (!device || !this.currentSelf) return false;

    try {
      this.currentSelf.selectAudioInputDevice(device);
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
    if (!device) return false;

    try {
      // @ts-ignore - speaker selection may not be in types
      if (this.currentSelf?.selectAudioOutputDevice) {
        // @ts-ignore
        this.currentSelf.selectAudioOutputDevice(device);
      }
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
    if (!this.currentSelf) return;
    try {
      await this.currentSelf.toggleMuteVideo();
      this.state.isVideoMuted = !this.state.isVideoMuted;
      this.onChange();
    } catch (error) {
      console.error("Failed to toggle video:", error);
    }
  }

  async toggleAudio(): Promise<void> {
    if (!this.currentSelf) return;
    try {
      await this.currentSelf.toggleMute();
      this.state.isAudioMuted = !this.state.isAudioMuted;
      this.onChange();
    } catch (error) {
      console.error("Failed to toggle audio:", error);
    }
  }

  async toggleSpeaker(): Promise<void> {
    if (!this.currentSelf) return;
    try {
      await this.currentSelf.toggleDeaf();
      this.state.isSpeakerMuted = !this.state.isSpeakerMuted;
      this.onChange();
    } catch (error) {
      console.error("Failed to toggle speaker:", error);
    }
  }

  async toggleAutoGainControl(): Promise<void> {
    this.state.autoGainControl = !this.state.autoGainControl;
    DevicePersistence.saveAudioProcessingSettings({
      autoGainControl: this.state.autoGainControl,
      noiseSuppression: this.state.noiseSuppression,
    });
    if (this.currentSelf) {
      try {
        if (this.currentSelf.autoGain !== this.state.autoGainControl) {
          await this.currentSelf.toggleAudioInputAutoGain();
        }
      } catch (error) {
        console.error("Failed to toggle auto gain:", error);
      }
    }
    this.onChange();
  }

  async toggleNoiseSuppression(): Promise<void> {
    this.state.noiseSuppression = !this.state.noiseSuppression;
    DevicePersistence.saveAudioProcessingSettings({
      autoGainControl: this.state.autoGainControl,
      noiseSuppression: this.state.noiseSuppression,
    });
    if (this.currentSelf) {
      try {
        if (this.currentSelf.noiseSuppression !== this.state.noiseSuppression) {
          await this.currentSelf.toggleNoiseSuppression();
        }
      } catch (error) {
        console.error("Failed to toggle noise suppression:", error);
      }
    }
    this.onChange();
  }

  clearDevicePreferences() {
    DevicePersistence.clearPreferences();
  }

  getStoredDeviceInfo() {
    return DevicePersistence.getStoredDeviceInfo();
  }

  reset() {
    const savedMicrophone = this.state.selectedMicrophone;
    const savedCamera = this.state.selectedCamera;
    const savedSpeaker = this.state.selectedSpeaker;
    const savedDevices = this.state.devices;
    const savedAutoGainControl = this.state.autoGainControl;
    const savedNoiseSuppression = this.state.noiseSuppression;

    this.callSubscriptions.forEach((s) => s.unsubscribe());
    this.callSubscriptions = [];

    if (this.deviceChangeHandler) {
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        this.deviceChangeHandler
      );
      this.deviceChangeHandler = null;
    }

    if (this.permissionStream) {
      this.permissionStream.getTracks().forEach((track) => track.stop());
      this.permissionStream = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    this.call = null;
    this.currentSelf = null;

    this.state = new DevicesState();
    this.state.selectedMicrophone = savedMicrophone;
    this.state.selectedCamera = savedCamera;
    this.state.selectedSpeaker = savedSpeaker;
    this.state.devices = savedDevices;
    this.state.autoGainControl = savedAutoGainControl;
    this.state.noiseSuppression = savedNoiseSuppression;

    this.onLoad = () => {};
    this.onChange = () => {};
    this.onAspectRatioChange = () => {};
  }
}

export default Devices.getInstance();

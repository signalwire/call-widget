import { CONFIG } from "./config";
import * as SignalWire from "@signalwire/js";

export class DemoCall {
  constructor() {
    this.client = null;
    this.currentCall = null;
    this.localStream = null;
    this.isActive = false;

    // Create and initialize UI
    this._createVideoModal();
    this._initializeElements();
    this._initializeEventListeners();
    this._initializeDemoButtons();
    this._loadDevices();
  }

  _createVideoModal() {
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.id = "video-modal";
    modal.innerHTML = `
      <div class="modal-content">
        <div class="video-layout">
          <div id="root-element" class="sw-video-layer"></div>
          <video id="local-video" class="hidden" autoplay playsinline muted></video>
          <div class="ui-overlay-layer">
            <div id="video-placeholder" class="video-placeholder">
              <div class="connecting-spinner"></div>
              <div class="error-x"></div>
              <div class="connecting-text">Connecting to agent...</div>
            </div>
            <div class="settings-control">
              <button id="settingsButton" type="button">
                <i class="fas fa-cog"></i>
              </button>
              <div class="device-selectors">
                <div class="select-wrapper">
                  <i class="fas fa-microphone"></i>
                  <select id="audioInput"></select>
                </div>
                <div class="select-wrapper">
                  <i class="fas fa-volume-up"></i>
                  <select id="audioOutput"></select>
                </div>
                <div class="select-wrapper">
                  <i class="fas fa-video"></i>
                  <select id="videoInput"></select>
                </div>
              </div>
            </div>
            <div class="call-controls">
              <button id="hangup-button" class="hangup-button">
                <i class="fas fa-phone-slash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  _initializeElements() {
    this.elements = {
      modal: document.getElementById("video-modal"),
      root: document.getElementById("root-element"),
      localVideo: document.getElementById("local-video"),
      hangupButton: document.getElementById("hangup-button"),
      placeholder: document.getElementById("video-placeholder"),
      settingsButton: document.getElementById("settingsButton"),
      audioInput: document.getElementById("audioInput"),
      audioOutput: document.getElementById("audioOutput"),
      videoInput: document.getElementById("videoInput"),
      deviceSelectors: document.querySelector(".device-selectors"),
    };

    // Add device change monitoring
    navigator.mediaDevices.addEventListener("devicechange", () => {
      this._loadDevices();
    });
  }

  _initializeEventListeners() {
    this.elements.hangupButton?.addEventListener("click", () => this.endCall());
    this.elements.settingsButton?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.elements.deviceSelectors?.classList.toggle("show");
    });

    document.addEventListener("click", (event) => {
      if (
        this.elements.deviceSelectors?.classList.contains("show") &&
        !this.elements.settingsButton?.contains(event.target) &&
        !this.elements.deviceSelectors?.contains(event.target)
      ) {
        this.elements.deviceSelectors.classList.remove("show");
      }
    });

    // Device change listeners with device type and preference saving
    ["audioInput", "videoInput", "audioOutput"].forEach((type) => {
      this.elements[type]?.addEventListener("change", async (e) => {
        // Save preference
        localStorage.setItem(`selected${type}`, e.target.value);

        if (type === "audioOutput") {
          await this._updateAudioOutput(e.target.value);
        } else {
          await this._updateMediaStream(type);
        }
      });
    });
  }

  async _loadDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this._updateDeviceSelectors(devices);
      this._restoreDevicePreferences();
    } catch (error) {
      console.error("Failed to load devices:", error);
    }
  }

  _updateDeviceSelectors(devices) {
    const selectors = {
      audioinput: this.elements.audioInput,
      audiooutput: this.elements.audioOutput,
      videoinput: this.elements.videoInput,
    };

    Object.entries(selectors).forEach(([kind, selector]) => {
      if (!selector) return;

      selector.innerHTML = `<option value="default">Default ${kind
        .replace("input", " Input")
        .replace("output", " Output")}</option>`;

      devices
        .filter((device) => device.kind === kind)
        .forEach((device) => {
          const option = document.createElement("option");
          option.value = device.deviceId;
          option.text =
            device.label ||
            `${device.kind} (${device.deviceId.slice(0, 5)}...)`;
          selector.appendChild(option);
        });
    });
  }

  _restoreDevicePreferences() {
    ["audioInput", "audioOutput", "videoInput"].forEach((type) => {
      const saved = localStorage.getItem(`selected${type}`);
      const element = this.elements[type];
      if (element?.options.length > 0) {
        element.value = saved || element.options[0].value;
      }
    });
  }

  async _updateMediaStream(changedDeviceType) {
    if (!this.isActive) return;

    try {
      const constraints = await this._getMediaConstraints();
      const mediaConstraints = {
        audio: changedDeviceType === "audioInput" ? constraints.audio : false,
        video: changedDeviceType === "videoInput" ? constraints.video : false,
      };

      // Get new stream before cleaning up old one to avoid flickering
      const newStream = await navigator.mediaDevices.getUserMedia(
        mediaConstraints
      );
      const newTrack =
        changedDeviceType === "audioInput"
          ? newStream.getAudioTracks()[0]
          : newStream.getVideoTracks()[0];

      if (!newTrack) {
        // Clean up the new stream if we didn't get the track we wanted
        newStream.getTracks().forEach((track) => {
          track.enabled = false;
          track.stop();
        });
        return;
      }

      if (this.localStream) {
        const oldTrack =
          changedDeviceType === "audioInput"
            ? this.localStream.getAudioTracks()[0]
            : this.localStream.getVideoTracks()[0];

        if (oldTrack) {
          oldTrack.enabled = false;
          oldTrack.stop();
          this.localStream.removeTrack(oldTrack);
        }

        this.localStream.addTrack(newTrack);

        if (changedDeviceType === "videoInput") {
          if (newTrack) {
            // Allow time for video to start playing before showing
            requestAnimationFrame(() => {
              this.elements.localVideo.classList.remove("hidden");
            });
          } else {
            this.elements.localVideo.classList.add("hidden");
          }
        }

        // Update the call if active
        if (this.currentCall) {
          await (changedDeviceType === "audioInput"
            ? this.currentCall.updateMicrophone(constraints.audio)
            : this.currentCall.updateCamera(constraints.video));
        }

        // Refresh video element
        this.elements.localVideo.srcObject = null;
        this.elements.localVideo.srcObject = this.localStream;
      } else {
        this.localStream = newStream;
        this.elements.localVideo.srcObject = this.localStream;
      }
    } catch (error) {
      console.error("Error updating media stream:", error);
      this._showError(error);
    }
  }

  async _updateAudioOutput(deviceId) {
    if (!this.currentCall) return;

    try {
      await this.currentCall.updateSpeaker({
        deviceId: deviceId,
      });
    } catch (error) {
      console.error("Error setting audio output:", error);
      this._showError(error);
    }
  }

  _initializeDemoButtons() {
    document.querySelectorAll(".demo-button").forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        const demoType = button.getAttribute("data-demo-type");
        if (demoType) {
          this.startDemo(demoType);
        }
      });
    });
  }

  async _getMediaConstraints() {
    const audioId = this.elements.audioInput?.value;
    const videoId = this.elements.videoInput?.value;

    return {
      audio:
        audioId && audioId !== "default"
          ? { deviceId: { ideal: audioId } }
          : true,
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        ...(videoId && videoId !== "default"
          ? { deviceId: { ideal: videoId } }
          : {}),
      },
    };
  }

  async startDemo(demoType) {
    const endpoint = CONFIG.ENDPOINTS[demoType];
    if (!endpoint) throw new Error("Invalid demo type");
    await this.makeCall(
      endpoint.path,
      endpoint.supportsVideo,
      endpoint.supportsAudio
    );
  }

  async makeCall(destination, videoEnabled, audioEnabled) {
    if (!destination) throw new Error("Destination is required");

    try {
      if (!window.isSecureContext) {
        throw new Error(
          "WebRTC requires a secure context (HTTPS or localhost). Please use HTTPS."
        );
      }

      if (this.currentCall) {
        await this.endCall();
      }

      this.isActive = true;
      this._updateUI(true);

      // Get devices first without requesting media
      const devices = await navigator.mediaDevices.enumerateDevices();
      let initialStream;
      if (!devices.some((device) => device.label)) {
        // Only request the media types we'll actually use
        initialStream = await navigator.mediaDevices.getUserMedia({
          audio: audioEnabled,
          video: videoEnabled,
        });
      }
      await this._loadDevices();

      if (!this.client) {
        this.client = await SignalWire.SignalWire({
          token: CONFIG.TOKEN,
          debug: CONFIG.DEBUG,
        });
      }

      const constraints = await this._getMediaConstraints();
      try {
        // Ensure any existing stream is fully cleaned up before requesting a new one
        if (this.localStream) {
          this.localStream.getTracks().forEach((track) => {
            track.stop();
            track.enabled = false;
          });
          this.localStream = null;
        }

        // Use the initial stream if we have it, otherwise request a new one
        if (initialStream) {
          this.localStream = initialStream;
        } else {
          this.localStream = await navigator.mediaDevices.getUserMedia({
            audio: audioEnabled && constraints.audio,
            video: videoEnabled && constraints.video,
          });
        }
      } catch (streamError) {
        console.log("Stream error:", streamError);
        if (streamError.name === "OverconstrainedError") {
          // Fallback to default devices
          this.localStream = await navigator.mediaDevices.getUserMedia({
            audio: audioEnabled,
            video: videoEnabled && {
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });
        } else {
          throw streamError;
        }
      }

      this.elements.localVideo.srcObject = this.localStream;
      // Show local video when we have a stream
      if (videoEnabled && this.localStream.getVideoTracks().length > 0) {
        // Allow time for video to start playing before showing
        this.elements.localVideo.addEventListener(
          "loadedmetadata",
          () => {
            requestAnimationFrame(() => {
              this.elements.localVideo.classList.remove("hidden");
            });
          },
          { once: true }
        );
      }

      this.currentCall = await this.client.dial({
        to: destination,
        rootElement: this.elements.root,
        audio: audioEnabled,
        video: videoEnabled ? constraints.video : false,
        negotiateVideo: videoEnabled,
      });

      this._setupCallEventListeners();
      await this.currentCall.start();
    } catch (error) {
      console.error("Call failed:", error);
      await this.endCall();
      this._showError(error);
    }
  }

  _setupCallEventListeners() {
    if (!this.currentCall) return;

    this.currentCall.on("active", () => {
      if (!this.isActive) {
        this.endCall();
        return;
      }
      this._updateUI(true);
      this.elements.root.classList.add("active");
      this.elements.placeholder.style.display = "none";
    });

    this.currentCall.on("destroy", () => this.endCall());
    this.currentCall.on("error", (error) => {
      console.error("Call error:", error);
      this.endCall();
      this._showError(error);
    });
  }

  async endCall() {
    this.isActive = false;

    try {
      if (this.currentCall?.state === "active") {
        console.log("Hanging up call - currently active...");
        await this.currentCall.hangup();
      }

      if (this.localStream) {
        // Ensure all tracks are properly stopped and cleaned up
        this.localStream.getTracks().forEach((track) => {
          track.enabled = false;
          track.stop();
          this.localStream.removeTrack(track);
        });
        this.elements.localVideo.srcObject = null;
        this.localStream = null;
      }

      this._updateUI(false);
      this.currentCall = null;
    } catch (error) {
      console.error("Error ending call:", error);
      this._updateUI(false);
    }
  }

  _updateUI(isShowing) {
    const isCallActive = isShowing && this.currentCall?.state === "active";

    this.elements.modal.style.display = isShowing ? "flex" : "none";
    this.elements.placeholder.style.display =
      isShowing && !isCallActive ? "flex" : "none";
    this.elements.hangupButton.style.display = isCallActive ? "block" : "none";
    this.elements.root.classList.toggle("active", isCallActive);

    if (!isShowing) {
      this.elements.localVideo.srcObject = null;
      this.elements.localVideo.classList.add("hidden");
    }
  }

  _showError(error) {
    console.error("Error:", error);

    const errorMessages = {
      NotAllowedError:
        "Camera/Microphone access denied. Please check your browser permissions.",
      PermissionDeniedError:
        "Camera/Microphone access denied. Please check your browser permissions.",
      NotFoundError:
        "Camera/Microphone not found. Please check your device connections.",
      NotReadableError:
        "Could not access your camera/microphone. They might be in use by another application.",
      TrackStartError:
        "Could not access your camera/microphone. They might be in use by another application.",
      OverconstrainedError:
        "The requested camera/microphone settings are not supported by your device.",
      TypeError:
        "Invalid media constraints. Please check your device settings.",
    };

    alert(
      errorMessages[error.name] ||
        `${error.name}: ${error.message}` ||
        "An error occurred"
    );
  }

  cleanup() {
    this.endCall();
    this.client = null;
    this.elements = null;
  }
}

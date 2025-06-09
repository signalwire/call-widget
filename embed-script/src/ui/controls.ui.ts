import controls from "./controls.html.ts";
import devices from "../Devices.ts";
import checkIcon from "../icons/check.svg?raw";

export default async function createControls(
  onHangup?: () => void,
  config?: { supportsVideo?: boolean; supportsAudio?: boolean }
) {
  devices.onChange = updateUI;

  const {
    controlsContainer,
    videoButton,
    micButton,
    speakerButton,
    hangupButton,
    videoDevicesButton,
    micDevicesButton,
    speakerDevicesButton,
    videoDevicesMenu,
    micDevicesMenu,
    speakerDevicesMenu,
  } = controls();

  // Check if we're in audio transcript mode
  const isAudioTranscriptMode =
    controlsContainer.closest(".audio-transcript-mode") !== null;

  // Hide video controls if video is not supported
  if (!config?.supportsVideo) {
    videoButton.style.display = "none";
    videoDevicesButton.style.display = "none";
    videoDevicesMenu.style.display = "none";
  }

  // Hide audio controls if audio is not supported
  if (!config?.supportsAudio) {
    micButton.style.display = "none";
    micDevicesButton.style.display = "none";
    micDevicesMenu.style.display = "none";
    speakerButton.style.display = "none";
    speakerDevicesButton.style.display = "none";
    speakerDevicesMenu.style.display = "none";
  }

  function updateUI() {
    const {
      isVideoMuted,
      isAudioMuted,
      isSpeakerMuted,
      videoinput,
      audioinput,
      audiooutput,
      selectedCamera,
      selectedMicrophone,
      selectedSpeaker,
    } = devices.state;

    function setIconVisibility(button: HTMLElement, isMuted: boolean) {
      const mutedIcon = button.querySelector(".muted-icon") as HTMLElement;
      const unmutedIcon = button.querySelector(".unmuted-icon") as HTMLElement;
      if (mutedIcon && unmutedIcon) {
        mutedIcon.style.display = isMuted ? "block" : "none";
        unmutedIcon.style.display = isMuted ? "none" : "block";
      }
    }

    // Update mute icons
    if (config?.supportsVideo) {
      setIconVisibility(videoButton, isVideoMuted);
    }
    if (config?.supportsAudio) {
      setIconVisibility(micButton, isAudioMuted);
      setIconVisibility(speakerButton, isSpeakerMuted);
    }

    // Update device buttons visibility and state
    if (!isAudioTranscriptMode && config?.supportsVideo) {
      videoDevicesButton.style.display =
        videoinput.length > 0 ? "block" : "none";
      (videoDevicesButton as HTMLButtonElement).disabled = isVideoMuted;
      videoButton.classList.toggle("standalone", videoinput.length === 0);
    }

    if (config?.supportsAudio) {
      micDevicesButton.style.display = audioinput.length > 0 ? "block" : "none";
      (micDevicesButton as HTMLButtonElement).disabled = isAudioMuted;
      micButton.classList.toggle("standalone", audioinput.length === 0);

      speakerDevicesButton.style.display =
        audiooutput.length > 0 ? "block" : "none";
      (speakerDevicesButton as HTMLButtonElement).disabled = isSpeakerMuted;
      speakerButton.classList.toggle("standalone", audiooutput.length === 0);
    }

    // Update device menus
    if (!isAudioTranscriptMode && config?.supportsVideo) {
      updateDeviceMenu(videoDevicesMenu, videoinput, selectedCamera, "camera");
    }
    if (config?.supportsAudio) {
      updateDeviceMenu(
        micDevicesMenu,
        audioinput,
        selectedMicrophone,
        "microphone"
      );
      updateDeviceMenu(
        speakerDevicesMenu,
        audiooutput,
        selectedSpeaker,
        "speaker"
      );
    }
  }

  function updateDeviceMenu(
    menu: HTMLElement,
    devices: MediaDeviceInfo[],
    selected: MediaDeviceInfo | null,
    type: "camera" | "microphone" | "speaker"
  ) {
    menu.innerHTML = devices
      .map(
        (device) => `
      <div class="device-option ${
        device.deviceId === selected?.deviceId ? "selected" : ""
      }" data-device-id="${device.deviceId}">
        ${device.deviceId === selected?.deviceId ? checkIcon : ""}
        ${device.label || `${type} ${devices.indexOf(device) + 1}`}
      </div>
    `
      )
      .join("");
  }

  // Toggle handlers
  videoButton.addEventListener("click", () => devices.toggleVideo());
  micButton.addEventListener("click", () => devices.toggleAudio());
  speakerButton.addEventListener("click", () => devices.toggleSpeaker());
  hangupButton.addEventListener("click", () => onHangup?.());

  // Device menu handlers
  function setupDeviceMenu(
    button: HTMLElement,
    menu: HTMLElement,
    updateFn: (deviceId: string) => Promise<boolean>
  ) {
    button.addEventListener("click", (e) => {
      e.stopPropagation();

      const allMenus = [videoDevicesMenu, micDevicesMenu, speakerDevicesMenu];
      allMenus.forEach((m) => {
        if (m !== menu) m.style.display = "none";
      });

      menu.style.display = menu.style.display === "none" ? "block" : "none";
    });

    menu.addEventListener("click", async (e) => {
      const option = (e.target as HTMLElement).closest(".device-option");
      if (option) {
        const deviceId = option.getAttribute("data-device-id");
        if (deviceId) {
          await updateFn(deviceId);
          menu.style.display = "none";
        }
      }
    });
  }

  setupDeviceMenu(videoDevicesButton, videoDevicesMenu, (deviceId) =>
    devices.updateCamera(deviceId)
  );
  setupDeviceMenu(micDevicesButton, micDevicesMenu, (deviceId) =>
    devices.updateMicrophone(deviceId)
  );
  setupDeviceMenu(speakerDevicesButton, speakerDevicesMenu, (deviceId) =>
    devices.updateSpeaker(deviceId)
  );

  // Close menus when clicking outside
  document.addEventListener("click", () => {
    videoDevicesMenu.style.display = "none";
    micDevicesMenu.style.display = "none";
    speakerDevicesMenu.style.display = "none";
  });

  updateUI(); // Initial UI update
  return controlsContainer;
}

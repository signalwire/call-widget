import modal from "./modal.html.ts";
import html from "../lib/html.ts";

export default function modalUI() {
  const {
    modalContainer,
    videoPanel,
    videoArea,
    localVideoArea,
    controlsPanel,
    chatPanel,
    videoPanelBackground,
  } = modal();

  localVideoArea.addEventListener("click", () => {
    localVideoArea.classList.toggle("flipped");
  });

  const imageMaker = html`<img
    name="image"
    src="https://developer.signalwire.com/img/call-widget/sw_background.webp"
  />`;

  const { image } = imageMaker();

  const loadImage = () => {
    videoPanelBackground.classList.add("loaded");
    videoPanelBackground.style.backgroundImage = `url(${
      (image as HTMLImageElement).src
    })`;
  };

  if ("decode" in image) {
    (image as HTMLImageElement)
      .decode()
      .then(loadImage)
      .catch(() => {
        // Fallback if decode fails
        loadImage();
      });
  } else {
    // Fallback for browsers that don't support decode()
    image.onload = loadImage;
  }

  return {
    modalContainer,
    videoPanel,
    videoArea,
    localVideoArea,
    controlsPanel,
    chatPanel,
  };
}

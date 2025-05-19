import modal from "./video-modal.html.ts";
import html from "../lib/html.ts";

export default function videoModalUI() {
  const {
    modalContainer,
    videoPanel,
    videoArea,
    localVideoArea,
    controlsPanel,
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
        loadImage();
      });
  } else {
    image.onload = loadImage;
  }

  return {
    modalContainer,
    videoPanel,
    videoArea,
    localVideoArea,
    controlsPanel,
  };
}

import modal from "./transcript-modal.html.ts";

export default function transcriptModalUI() {
  const { modalContainer, transcriptPanel, transcriptArea, controlsPanel } =
    modal();

  return {
    modalContainer,
    transcriptPanel,
    transcriptArea,
    controlsPanel,
  };
}

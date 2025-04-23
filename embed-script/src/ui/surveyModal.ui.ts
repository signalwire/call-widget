import surveyModalHTML from "./surveyModal.html.ts";

interface SurveyParams {
  title: string;
  description: string;
  href: string;
}

function surveyModal(
  surveyParams: SurveyParams | undefined,
  onClose: () => void
) {
  if (!surveyParams) {
    onClose();
    return;
  }

  const { surveyModal, closeButton, titleEl, messageEl, surveyLink } =
    surveyModalHTML();
  titleEl.textContent =
    surveyParams.title ?? "Would you like to take a survey?";
  messageEl.textContent =
    surveyParams.description ??
    "We would love to hear your thoughts. Would you like to take a survey? It only takes 2 minutes.";
  (surveyLink as HTMLAnchorElement).href = "#";

  closeButton?.addEventListener("click", () => {
    onClose();
  });

  surveyLink?.addEventListener("click", (e) => {
    e.preventDefault();
    window.open(surveyParams.href, "_blank");
    onClose();
  });

  return surveyModal;
}

export default surveyModal;

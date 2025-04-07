import errorModalHTML from "./errorModal.html.ts";

function errorModal(title: string, message: string, onClose: () => void) {
  const { errorModal, closeButton, titleEl, messageEl } = errorModalHTML();
  titleEl.textContent = title;
  messageEl.textContent = message;
  closeButton?.addEventListener("click", () => {
    onClose();
  });
  return errorModal;
}

export default errorModal;

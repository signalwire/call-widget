import userForm from "./userForm.html";
import { UserVariables } from "../Call";

export interface UserFormOptions {
  onSubmit: (variables: UserVariables) => void;
  onClose: () => void;
}

export function createUserForm({ onSubmit, onClose }: UserFormOptions) {
  const {
    userFormContainer,
    userName,
    userEmail,
    userPhone,
    skipButton,
    closeButton,
  } = userForm();

  const fadeAndRemove = (callback: () => void) => {
    userFormContainer.classList.add("fade-out");
    setTimeout(() => {
      userFormContainer.remove();
      callback();
    }, 300);
  };

  closeButton.addEventListener("click", () => {
    fadeAndRemove(onClose);
  });

  skipButton.addEventListener("click", () => {
    const emptyVariables = {
      userName: "",
      userEmail: "",
      userPhone: "",
    };
    fadeAndRemove(() => onSubmit(emptyVariables));
  });

  const form = userFormContainer.querySelector("form");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const userVariables = {
      userName: (userName as HTMLInputElement).value,
      userEmail: (userEmail as HTMLInputElement).value,
      userPhone: (userPhone as HTMLInputElement).value,
    };

    fadeAndRemove(() => onSubmit(userVariables));
  });

  return {
    userFormContainer,
    destroy: () => fadeAndRemove(() => {}),
  };
}

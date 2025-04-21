import userForm from "./userForm.html";
import { UserVariables } from "../Call";

export interface UserFormOptions {
  onSubmit: (variables: UserVariables) => void;
}

export function createUserForm({ onSubmit }: UserFormOptions) {
  const { userFormContainer, userName, userEmail, userPhone, skipButton } =
    userForm();

  skipButton.addEventListener("click", () => {
    const emptyVariables = {
      userName: "",
      userEmail: "",
      userPhone: "",
    };
    userFormContainer.remove();
    onSubmit(emptyVariables);
  });

  const form = userFormContainer.querySelector("form");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const userVariables = {
      userName: (userName as HTMLInputElement).value,
      userEmail: (userEmail as HTMLInputElement).value,
      userPhone: (userPhone as HTMLInputElement).value,
    };

    userFormContainer.remove();
    onSubmit(userVariables);
  });

  return {
    userFormContainer,
    destroy: () => userFormContainer.remove(),
  };
}

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

const e = {
  f() {
    return 1;
  },
  g() {
    return 2;
  },
  date: "25",
};

export default e;

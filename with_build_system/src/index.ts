import { DemoCall } from "./DemoCall";

const demoCall = new DemoCall();
window.addEventListener("unload", () => demoCall.cleanup());

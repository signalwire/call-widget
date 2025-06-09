import { ChatEntry } from "../Chat";
import tail from "../icons/chat-tail.svg?raw";
import nanomorph from "nanomorph";
import showdown from "showdown";
import html from "../lib/html";

export default function createChatUI(
  chatHistory: ChatEntry[],
  currentRoot: HTMLElement
) {
  const SCROLL_THRESHOLD = 300;

  const chatPanelScrolledToBottom =
    currentRoot.scrollHeight - currentRoot.clientHeight <=
    currentRoot.scrollTop + SCROLL_THRESHOLD;
  const previousScrollTop = currentRoot.scrollTop;

  const converter = new showdown.Converter();
  converter.setOption("openLinksInNewWindow", true);

  const createMessageHTML = (entry: ChatEntry) => {
    const messageClass =
      entry.type === "user" ? "message-sent" : "message-received";
    const inProgressClass = entry.state === "partial" ? "in-progress" : "";
    const messageContent = converter.makeHtml(entry.text);

    return `<div class="message ${messageClass} ${inProgressClass}">
      ${messageContent}
      <div class="tail">${tail}</div>
    </div>`;
  };

  const messages = chatHistory.map(createMessageHTML).join("");

  const { chatContainer, chat } = html`
    <div name="chatContainer" class="chat-container">
      <div class="chat" name="chat">${messages}</div>
    </div>
  `();

  if (currentRoot.querySelector(".chat") !== null) {
    nanomorph(currentRoot.querySelector(".chat")!, chat);
  } else {
    currentRoot.appendChild(chatContainer);
  }

  if (chatPanelScrolledToBottom) {
    currentRoot.scrollTo({
      top: currentRoot.scrollHeight,
      behavior: "smooth",
    });
  } else {
    currentRoot.scrollTop = previousScrollTop;
  }
}

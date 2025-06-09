export interface ChatEntry {
  type: "ai" | "user";
  text: string;
  state: "partial" | "complete";
}

export class ChatState {
  entries: ChatEntry[] = [];
  lastSpoken: "ai" | "user" | null = null;
}

// Chat class takes all the chat related events
// from client, and accumulates them into a single
// state, which can rendered with a pure function.

// note: these four things should probably be modeled as a fsm?
export class Chat {
  state: ChatState;

  aiPartialResult: ChatEntry | null = null;
  userPartialResult: ChatEntry | null = null;

  constructor() {
    this.state = new ChatState();
  }

  getHistory(): ChatEntry[] {
    const history = [...this.state.entries];

    if (this.aiPartialResult && this.userPartialResult) {
      if (this.state.lastSpoken === "user") {
        history.push(this.aiPartialResult);
        history.push(this.userPartialResult);
      } else {
        history.push(this.userPartialResult);
        history.push(this.aiPartialResult);
      }
    } else if (this.aiPartialResult) {
      history.push(this.aiPartialResult);
    } else if (this.userPartialResult) {
      history.push(this.userPartialResult);
    }

    return history;
  }

  handleEvent(
    event:
      | "ai.response_utterance"
      | "ai.completion"
      | "ai.partial_result"
      | "ai.speech_detect"
      | "ai.transparent_barge",
    text: string,
    barged: boolean
  ) {
    switch (event) {
      case "ai.response_utterance":
        if (!this.aiPartialResult) {
          this.aiPartialResult = { type: "ai", text, state: "partial" };
        } else {
          this.aiPartialResult.text += " " + text;
        }
        this.state.lastSpoken = "ai";
        break;

      case "ai.completion":
        if (this.aiPartialResult) {
          this.state.entries.push({
            ...this.aiPartialResult,
            state: "complete",
          });
          this.aiPartialResult = null;
        }
        this.state.lastSpoken = barged ? "user" : "ai";
        break;

      case "ai.partial_result":
        this.userPartialResult = { type: "user", text, state: "partial" };
        this.state.lastSpoken = "user";
        break;

      case "ai.speech_detect":
        if (this.userPartialResult) {
          this.state.entries.push({
            ...this.userPartialResult,
            state: "complete",
            text,
          });
          this.userPartialResult = null;
        } else {
          this.state.entries.push({
            type: "user",
            text,
            state: "complete",
          });
        }
        this.state.lastSpoken = "user";
        break;

      case "ai.transparent_barge":
        // Only clear the current partial AI result since that's what's being interrupted
        this.aiPartialResult = null;

        // Add the user's interruption
        this.state.entries.push({
          type: "user",
          text,
          state: "complete",
        });
        this.state.lastSpoken = "user";
        break;
    }

    this.onUpdate();
  }

  // meant to be overridden
  onUpdate() {}
}

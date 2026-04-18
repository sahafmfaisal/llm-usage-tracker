import { UsageTracker } from "./src/core/tracker.js";

const tracker = new UsageTracker();

function getRuntime() {
  return globalThis.browser?.runtime || globalThis.chrome?.runtime;
}

getRuntime().onMessage.addListener((message, sender, sendResponse) => {
  const type = message?.type;

  if (type === "LLM_USAGE_EVENT") {
    tracker
      .recordUsage(message.payload || {})
      .then(() => sendResponse({ ok: true }))
      .catch((error) => {
        console.error("Failed to record usage event", error);
        sendResponse({ ok: false, error: String(error) });
      });
    return true;
  }

  if (type === "GET_STATS") {
    tracker
      .getStats()
      .then((stats) => sendResponse({ ok: true, stats }))
      .catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }

  if (type === "RESET_USAGE") {
    tracker
      .resetStats()
      .then((stats) => sendResponse({ ok: true, stats }))
      .catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }

  return false;
});

(function bootstrapContentScript() {
  const host = location.hostname;
  let adapter = null;
  let adapterKey = null;

  function getRuntime() {
    return globalThis.browser?.runtime || globalThis.chrome?.runtime;
  }

  function getExtensionUrl(path) {
    const runtime = getRuntime();
    return runtime?.getURL(path);
  }

  function notifyUsage(payload) {
    const runtime = getRuntime();
    if (!runtime?.sendMessage) {
      return;
    }

    runtime.sendMessage({
      type: "LLM_USAGE_EVENT",
      payload
    });
  }

  async function loadAdapter() {
    if (host === "chat.openai.com") {
      const module = await import(getExtensionUrl("src/adapters/chatgpt.js"));
      adapterKey = "chatgpt";
      return module.createChatGPTAdapter({ onMessage: notifyUsage });
    }

    if (host === "claude.ai") {
      const module = await import(getExtensionUrl("src/adapters/claude.js"));
      adapterKey = "claude";
      return module.createClaudeAdapter({ onMessage: notifyUsage });
    }

    return null;
  }

  async function initializeAdapter() {
    adapter?.stop?.();
    adapter = await loadAdapter();
    adapter?.start?.();
  }

  function onRouteChanged() {
    if (!adapter) {
      return;
    }

    adapter.scan?.();
  }

  function patchHistory() {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function pushStatePatched(...args) {
      const result = originalPushState.apply(this, args);
      queueMicrotask(onRouteChanged);
      return result;
    };

    history.replaceState = function replaceStatePatched(...args) {
      const result = originalReplaceState.apply(this, args);
      queueMicrotask(onRouteChanged);
      return result;
    };

    addEventListener("popstate", onRouteChanged);
  }

  initializeAdapter();
  patchHistory();

  setInterval(() => {
    adapter?.scan?.();
  }, 2000);
})();

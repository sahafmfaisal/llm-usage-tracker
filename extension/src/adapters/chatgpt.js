const PLATFORM = "chatgpt";

export function createChatGPTAdapter({ onMessage }) {
  let observer = null;
  const seenFingerprints = new Set();

  const selectors = [
    '[data-message-author-role="user"]',
    'article [data-message-author-role="user"]',
    'main [data-message-author-role="user"]'
  ];

  function getSessionId() {
    const path = location.pathname || "/";
    return path.split("?")[0] || "root";
  }

  function buildFingerprint(text) {
    return `${getSessionId()}::${text.slice(0, 120)}::${text.length}`;
  }

  function emitIfNew(text) {
    const normalized = text.replace(/\s+/g, " ").trim();
    if (!normalized) {
      return;
    }

    const fingerprint = buildFingerprint(normalized);
    if (seenFingerprints.has(fingerprint)) {
      return;
    }

    seenFingerprints.add(fingerprint);

    onMessage({
      platform: PLATFORM,
      messageText: normalized,
      timestamp: Date.now(),
      sessionId: getSessionId(),
      url: location.href
    });

    if (seenFingerprints.size > 2000) {
      const entries = Array.from(seenFingerprints).slice(-1000);
      seenFingerprints.clear();
      for (const entry of entries) {
        seenFingerprints.add(entry);
      }
    }
  }

  function scan() {
    for (const selector of selectors) {
      const nodes = document.querySelectorAll(selector);
      for (const node of nodes) {
        emitIfNew(node.textContent || "");
      }
    }
  }

  let scanScheduled = false;

  function scheduleScan() {
    if (scanScheduled) {
      return;
    }
    scanScheduled = true;
    setTimeout(() => {
      scanScheduled = false;
      scan();
    }, 250);
  }

  function start() {
    scan();

    observer = new MutationObserver(() => {
      scheduleScan();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  function stop() {
    observer?.disconnect();
    observer = null;
  }

  return { start, stop, scan };
}

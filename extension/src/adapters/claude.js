const PLATFORM = "claude";

export function createClaudeAdapter({ onMessage }) {
  let observer = null;
  const seenFingerprints = new Set();

  const selectors = [
    '[data-testid*="user"]',
    '[data-testid*="human"]',
    '[class*="user"] [class*="message"]',
    'main [role="listitem"]'
  ];

  function getSessionId() {
    const path = location.pathname || "/";
    return path.split("?")[0] || "root";
  }

  function likelyUserNode(node) {
    const testId = node.getAttribute("data-testid") || "";
    const className = node.className || "";
    const ariaLabel = node.getAttribute("aria-label") || "";
    const hint = `${testId} ${className} ${ariaLabel}`.toLowerCase();
    return /user|human|you/.test(hint);
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
        if (likelyUserNode(node)) {
          emitIfNew(node.textContent || "");
        }
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

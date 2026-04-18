const STORAGE_KEY = "llmUsageTracker";

const DEFAULT_STATE = {
  version: 1,
  settings: {
    pricingPer1K: {
      default: 0.01,
      chatgpt: 0.01,
      claude: 0.01
    }
  },
  lifetime: {
    total: { messages: 0, tokens: 0, cost: 0 },
    platforms: {
      chatgpt: { messages: 0, tokens: 0, cost: 0 },
      claude: { messages: 0, tokens: 0, cost: 0 }
    }
  },
  sessions: {
    chatgpt: null,
    claude: null
  }
};

function cloneDefaultState() {
  return structuredClone(DEFAULT_STATE);
}

function getStorageArea() {
  if (globalThis.browser?.storage?.local) {
    return globalThis.browser.storage.local;
  }

  if (globalThis.chrome?.storage?.local) {
    return {
      get(keys) {
        return new Promise((resolve, reject) => {
          chrome.storage.local.get(keys, (result) => {
            const error = chrome.runtime?.lastError;
            if (error) {
              reject(error);
              return;
            }
            resolve(result);
          });
        });
      },
      set(items) {
        return new Promise((resolve, reject) => {
          chrome.storage.local.set(items, () => {
            const error = chrome.runtime?.lastError;
            if (error) {
              reject(error);
              return;
            }
            resolve();
          });
        });
      },
      remove(keys) {
        return new Promise((resolve, reject) => {
          chrome.storage.local.remove(keys, () => {
            const error = chrome.runtime?.lastError;
            if (error) {
              reject(error);
              return;
            }
            resolve();
          });
        });
      }
    };
  }

  throw new Error("No extension storage API available.");
}

function coerceNumericFields(base, incoming) {
  return {
    ...base,
    ...incoming,
    messages: Number(incoming.messages) || 0,
    tokens: Number(incoming.tokens) || 0,
    cost: Number(incoming.cost) || 0
  };
}

function mergeState(baseState, storedState = {}) {
  const merged = cloneDefaultState();
  const input = storedState || {};

  merged.version = input.version || merged.version;
  merged.settings.pricingPer1K = {
    ...merged.settings.pricingPer1K,
    ...(input.settings?.pricingPer1K || {})
  };

  for (const scope of ["total"]) {
    merged.lifetime[scope] = coerceNumericFields(
      merged.lifetime[scope],
      input.lifetime?.[scope] || {}
    );
  }

  for (const platform of Object.keys(merged.lifetime.platforms)) {
    merged.lifetime.platforms[platform] = coerceNumericFields(
      merged.lifetime.platforms[platform],
      input.lifetime?.platforms?.[platform] || {}
    );
  }

  for (const platform of Object.keys(merged.sessions)) {
    const incomingSession = input.sessions?.[platform];
    merged.sessions[platform] = incomingSession
      ? {
          sessionId: String(incomingSession.sessionId || "unknown"),
          startedAt: incomingSession.startedAt || Date.now(),
          lastUpdatedAt: incomingSession.lastUpdatedAt || Date.now(),
          messages: Number(incomingSession.messages) || 0,
          tokens: Number(incomingSession.tokens) || 0,
          cost: Number(incomingSession.cost) || 0
        }
      : null;
  }

  return { ...baseState, ...merged };
}

export class TrackerStorage {
  constructor() {
    this.storageArea = getStorageArea();
  }

  async getState() {
    const result = await this.storageArea.get(STORAGE_KEY);
    return mergeState(cloneDefaultState(), result?.[STORAGE_KEY]);
  }

  async setState(state) {
    await this.storageArea.set({ [STORAGE_KEY]: state });
  }

  async resetState() {
    const reset = cloneDefaultState();
    await this.setState(reset);
    return reset;
  }
}

export { STORAGE_KEY, DEFAULT_STATE };

import { UsageEstimator, roundCurrency } from "./estimator.js";
import { TrackerStorage } from "./storage.js";

function normalizePlatform(platform) {
  const value = String(platform || "").toLowerCase();
  if (value.includes("openai") || value.includes("chatgpt")) {
    return "chatgpt";
  }
  if (value.includes("claude") || value.includes("anthropic")) {
    return "claude";
  }
  return value || "unknown";
}

export class UsageTracker {
  constructor({ storage = new TrackerStorage(), estimator = new UsageEstimator() } = {}) {
    this.storage = storage;
    this.estimator = estimator;
    this._queue = Promise.resolve();
  }

  resolvePrice(state, platform) {
    return (
      state.settings?.pricingPer1K?.[platform] ??
      state.settings?.pricingPer1K?.default ??
      0
    );
  }

  ensureSession(state, platform, sessionId, timestamp) {
    const current = state.sessions[platform];

    if (!current || current.sessionId !== sessionId) {
      state.sessions[platform] = {
        sessionId,
        startedAt: timestamp,
        lastUpdatedAt: timestamp,
        messages: 0,
        tokens: 0,
        cost: 0
      };
    }

    return state.sessions[platform];
  }

  recordUsage(event) {
    const next = this._queue.then(() => this._doRecordUsage(event));
    this._queue = next.catch((err) => {
      console.error("[tokenpulse] recordUsage error:", err);
    });
    return next;
  }

  async _doRecordUsage(event) {
    const platform = normalizePlatform(event.platform);
    if (!["chatgpt", "claude"].includes(platform)) {
      return null;
    }

    const messageText = String(event.messageText || "").trim();
    if (!messageText) {
      return null;
    }

    const timestamp = Number(event.timestamp) || Date.now();
    const sessionId = String(event.sessionId || "default");
    const tokens = this.estimator.estimateTokens(messageText);

    const state = await this.storage.getState();
    const unitPrice = this.resolvePrice(state, platform);
    const cost = this.estimator.estimateCost(tokens, unitPrice);

    state.lifetime.total.messages += 1;
    state.lifetime.total.tokens += tokens;
    state.lifetime.total.cost = roundCurrency(state.lifetime.total.cost + cost);

    state.lifetime.platforms[platform].messages += 1;
    state.lifetime.platforms[platform].tokens += tokens;
    state.lifetime.platforms[platform].cost = roundCurrency(
      state.lifetime.platforms[platform].cost + cost
    );

    const session = this.ensureSession(state, platform, sessionId, timestamp);
    session.messages += 1;
    session.tokens += tokens;
    session.cost = roundCurrency(session.cost + cost);
    session.lastUpdatedAt = timestamp;

    await this.storage.setState(state);
    return state;
  }

  async getStats() {
    return this.storage.getState();
  }

  async resetStats() {
    return this.storage.resetState();
  }
}

export { normalizePlatform };

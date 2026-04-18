const DEFAULT_CHARACTERS_PER_TOKEN = 4;

export class UsageEstimator {
  constructor(options = {}) {
    this.charactersPerToken = options.charactersPerToken || DEFAULT_CHARACTERS_PER_TOKEN;
  }

  estimateTokens(text = "") {
    const normalized = String(text).trim();
    if (!normalized) {
      return 0;
    }

    return Math.max(1, Math.ceil(normalized.length / this.charactersPerToken));
  }

  estimateCost(tokens, pricePer1KTokens) {
    const safeTokens = Number(tokens) || 0;
    const safeRate = Number(pricePer1KTokens) || 0;
    return (safeTokens / 1000) * safeRate;
  }
}

export function roundCurrency(value) {
  return Math.round((Number(value) || 0) * 10000) / 10000;
}

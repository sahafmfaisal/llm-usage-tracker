# Tokenpulse

A minimal browser extension that tracks message count, estimated token usage, and cost analytics across LLM web apps (ChatGPT + Claude).

![Tokenpulse screenshot](./screenshot.png)

## Features

- **Message counter** — Tracks user message totals across supported platforms
- **Token estimate** — Uses a modular heuristic (`1 token ≈ 4 characters`) with a clean estimator interface for future tokenizer upgrades
- **Cost estimate** — Computes local estimated cost from configurable per-1K token pricing
- **Session + lifetime analytics** — Maintains current-session counters and lifetime totals
- **Platform breakdown** — Separates ChatGPT and Claude usage in the popup dashboard
- **SPA-aware tracking** — Handles dynamic navigation and content updates using observers + route change handling
- **Local-first privacy** — Stores analytics in extension local storage only (no external APIs)

## Supported platforms

- `https://chat.openai.com/*`
- `https://claude.ai/*`

## Installation

### Chrome / Edge / Chromium

1. Clone or download this repository.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the `extension/` folder.

### Safari

1. Use **Safari Web Extension Converter** on the `extension/` folder.
2. Open the generated Xcode project.
3. Build and run the Safari extension target.

## How it works

- Injects a content script into supported LLM apps.
- Dynamically loads a platform adapter (`chatgpt.js` or `claude.js`) based on hostname.
- Adapters observe DOM updates, detect user message content, and emit normalized usage events.
- Background service worker receives events and updates persistent stats through shared core modules:
  - `tracker.js` for normalization and accounting
  - `estimator.js` for tokens/cost
  - `storage.js` for schema + local persistence
- Popup dashboard reads current stats and renders totals, session metrics, platform breakdown, and reset controls.

## Privacy

- All data stays local in extension storage.
- No analytics uploads.
- No third-party API calls.
- Requests are limited to supported domains via extension host permissions.

## License

MIT (see [`LICENSE`](./LICENSE)).

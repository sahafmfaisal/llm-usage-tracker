# LLM Usage Tracker Extension

Production-ready Manifest V3 browser extension for tracking usage analytics on ChatGPT and Claude.

## Structure

- `extension/manifest.json` - MV3 manifest
- `extension/background.js` - service worker message router and tracker integration
- `extension/content.js` - adapter loader + SPA route handling
- `extension/src/adapters` - platform adapters (ChatGPT, Claude)
- `extension/src/core` - shared logic (storage, estimation, tracking)
- `extension/src/ui` - popup dashboard UI

## Features

- Tracks user message count
- Estimates token usage (`1 token ≈ 4 chars`)
- Tracks session + lifetime usage
- Platform breakdown for ChatGPT and Claude
- Local cost estimation with configurable per-1K pricing
- No external dependencies

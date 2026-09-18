# Experiential AI Chat

A modern ChatGPT-style web app powered by the Experiential Labs OpenAI-compatible API.

## Features

- Chat with models available to your Experiential Labs API key
- Model selector loaded from `GET /v1/models`
- Server-side API key, never exposed to browser JavaScript
- New chat button
- Responsive desktop and mobile UI
- Enter to send, Shift+Enter for a new line

## Setup

1. Copy `.env.example` to `.env.local`.
2. Put your Experiential Labs key in `EXPLABS_API_KEY`.
3. Optionally set `EXPLABS_MODEL`.
4. Run `npm install`.
5. Run `npm run dev`.
6. Open http://localhost:3000.

The gateway uses `https://api.experientiallabs.ai/v1` for OpenAI-compatible model discovery and chat completions.

Never commit `.env.local` or your API key.

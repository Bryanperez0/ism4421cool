# Tunesmith

A one-page AI music generator built on the [Suno API](https://docs.sunoapi.org), ready to deploy on Netlify.

## Features

- **Simple mode** — describe a song and pick a style; the AI writes the lyrics.
- **Custom mode** — your own title, lyrics, and style, plus length (10 s–6 min), voice, variety, styles to avoid, style strength, and creativity.
- **Write lyrics for me** — generate lyrics from a topic, then edit before generating.
- **Instrumental** toggle and model picker (V6, V6 Mini, V6 Wild).
- Live status while tracks generate, streaming preview as soon as the first version is ready, then MP3 download.
- Bring your own key — each visitor pastes their own Suno API key at runtime.
- Credit balance in the header.
- Track history saved in your browser (Suno keeps files for 14 days).

## How it works

```
public/index.html                  the whole front end (HTML, CSS, JS in one file)
netlify/functions/suno.mjs         pass-through relay at /api/suno
netlify/functions/suno-callback.mjs  no-op endpoint Suno requires as callBackUrl
netlify.toml                       Netlify build settings
```

No API key is stored anywhere. When the page opens, the visitor pastes their own Suno API key. The page keeps it in memory only (not in localStorage or cookies), so a refresh or closed tab clears it. Each request sends the key in an `x-suno-key` header to `/api/suno`, which forwards it to `https://api.sunoapi.org` and does not store it. The app polls for results instead of relying on callbacks.

The relay exists because Suno requires a `callBackUrl` on every task and may not allow direct browser (CORS) requests.

## Deploy to Netlify

1. In Netlify, choose **Add new site → Import an existing project** and pick this repo. Branch: `main`. Leave the build command empty; `netlify.toml` sets the rest.
2. Deploy. No environment variables are needed.
3. Open the site, paste your key from <https://sunoapi.org/api-key>, and click **Connect**.

## Run locally

```bash
npm i -g netlify-cli
netlify dev
```

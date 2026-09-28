# Tunesmith

A one-page AI music generator built on the [Suno API](https://docs.sunoapi.org), ready to deploy on Netlify.

## Features

- **Simple mode** — describe a song and pick a style; the AI writes the lyrics.
- **Custom mode** — your own title, lyrics, and style, plus length (10 s–6 min), voice, variety, styles to avoid, style strength, and creativity.
- **Write lyrics for me** — generate lyrics from a topic, then edit before generating.
- **Instrumental** toggle and model picker (V6, V6 Mini, V6 Wild).
- Live status while tracks generate, streaming preview as soon as the first version is ready, then MP3 download.
- Credit balance in the header.
- Track history saved in your browser (Suno keeps files for 14 days).

## How it works

```
public/index.html                  the whole front end (HTML, CSS, JS in one file)
netlify/functions/suno.mjs         proxy at /api/suno — adds the API key server-side
netlify/functions/suno-callback.mjs  no-op endpoint Suno requires as callBackUrl
netlify.toml                       Netlify build settings
```

The browser never sees the API key. It calls `/api/suno`, and the function forwards the request to `https://api.sunoapi.org` with the key from an environment variable. The app polls for results instead of relying on callbacks.

## Deploy to Netlify

1. In Netlify, choose **Add new site → Import an existing project** and pick this repo. Branch: `main`. Leave the build command empty; `netlify.toml` sets the rest.
2. Go to **Site configuration → Environment variables** and add:
   - `SUNO_API_KEY` — your key from <https://sunoapi.org/api-key> (**required**)
   - `APP_PASSCODE` — any password (**recommended**). Without it, anyone who finds your URL can spend your credits. With it, the app asks for the passcode once per browser.
3. Trigger a redeploy (**Deploys → Trigger deploy**) so the function picks up the variables.

## Run locally

```bash
npm i -g netlify-cli
echo "SUNO_API_KEY=your_key_here" > .env
netlify dev
```

`.env` is git-ignored. Never commit the key.

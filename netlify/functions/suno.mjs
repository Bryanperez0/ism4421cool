// Server-side proxy for the Suno API (https://docs.sunoapi.org).
// The API key lives in the SUNO_API_KEY environment variable and never reaches the browser.

const BASE = "https://api.sunoapi.org/api/v1";
const MODELS = ["V6", "V6_MINI", "V6_WILD"];

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const unit = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(Math.min(1, Math.max(0, n)) * 100) / 100 : undefined;
};

async function suno(path, key, init = {}) {
  const res = await fetch(BASE + path, {
    ...init,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { code: res.status, msg: text.slice(0, 300) || "Unexpected response from Suno API" };
  }
}

function buildGenerateBody(input, callBackUrl) {
  const custom = !!input.customMode;
  const instrumental = !!input.instrumental;
  const model = MODELS.includes(input.model) ? input.model : "V6";
  const style = str(input.style, 1000);
  const body = { customMode: custom, instrumental, model, callBackUrl };

  if (!custom) {
    const prompt = str(input.prompt, 3000);
    // Suno rejects non-custom requests that have no style/lyrics/media attachment.
    if (!style) throw new Error("Add a style (genre, mood, or instruments).");
    if (prompt) body.prompt = prompt;
    if (style) body.style = style;
    return body;
  }

  const lyrics = str(input.lyrics, 5000);
  const negativeTags = str(input.negativeTags, 1000);
  if (!style && !lyrics && !negativeTags) throw new Error("Custom mode needs a style or lyrics.");
  if (!instrumental && !lyrics) throw new Error("Add lyrics, or switch on Instrumental.");

  const title = str(input.title, 80);
  if (title) body.title = title;
  if (style) body.style = style;
  if (lyrics && !instrumental) body.lyrics = lyrics;
  if (negativeTags) body.negativeTags = negativeTags;
  if (input.vocalGender === "m" || input.vocalGender === "f") {
    if (!instrumental) body.vocalGender = input.vocalGender;
  }
  const sw = unit(input.styleWeight);
  const wc = unit(input.weirdnessConstraint);
  if (sw !== undefined) body.styleWeight = sw;
  if (wc !== undefined) body.weirdnessConstraint = wc;
  const variety = Number(input.variety);
  if (Number.isInteger(variety) && variety >= 0 && variety <= 4) body.variety = variety;
  const duration = Number(input.duration);
  if (Number.isFinite(duration)) body.duration = Math.round(Math.min(360, Math.max(10, duration)));
  return body;
}

export default async (req) => {
  const key = process.env.SUNO_API_KEY;
  if (!key) return json(500, { code: 500, msg: "SUNO_API_KEY is not set on the server." });

  const passcode = process.env.APP_PASSCODE;
  if (passcode && req.headers.get("x-app-passcode") !== passcode) {
    return json(401, { code: 401, msg: "Passcode required." });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  const callBackUrl = `${url.origin}/api/suno-callback`;

  try {
    switch (action) {
      case "credits":
        return json(200, await suno("/generate/credit", key));

      case "status":
      case "lyricsStatus": {
        const taskId = str(url.searchParams.get("taskId"), 100);
        if (!taskId) return json(400, { code: 400, msg: "Missing taskId." });
        const path = action === "status" ? "/generate/record-info" : "/lyrics/record-info";
        return json(200, await suno(`${path}?taskId=${encodeURIComponent(taskId)}`, key));
      }

      case "generate": {
        if (req.method !== "POST") return json(405, { code: 405, msg: "Use POST." });
        const input = await req.json().catch(() => ({}));
        let body;
        try {
          body = buildGenerateBody(input, callBackUrl);
        } catch (e) {
          return json(400, { code: 400, msg: e.message });
        }
        return json(200, await suno("/generate", key, { method: "POST", body: JSON.stringify(body) }));
      }

      case "lyrics": {
        if (req.method !== "POST") return json(405, { code: 405, msg: "Use POST." });
        const input = await req.json().catch(() => ({}));
        const prompt = str(input.prompt, 200);
        if (!prompt) return json(400, { code: 400, msg: "Describe what the lyrics should be about." });
        return json(
          200,
          await suno("/lyrics", key, { method: "POST", body: JSON.stringify({ prompt, callBackUrl }) })
        );
      }

      default:
        return json(400, { code: 400, msg: "Unknown action." });
    }
  } catch (e) {
    return json(502, { code: 502, msg: `Could not reach Suno API: ${e.message}` });
  }
};

export const config = { path: "/api/suno" };

/**
 * config.js
 * ---------
 * Connect a real backend / AI API here.
 *
 * Every feature module (symptom-checker.js, chat.js, skin-analysis.js,
 * bmi-calculator.js) calls tryBackend() first. If BACKEND_URL is empty,
 * unreachable, or the request errors out, each module quietly falls back
 * to its own local logic. That means:
 *   - the site works fully offline / standalone today, and
 *   - once you deploy a real backend, you only need to set BACKEND_URL
 *     below - no other file needs to change.
 */

const CONFIG = {
  // e.g. "https://api.aarogya.ai" - leave blank to use the built-in local AI logic
  BACKEND_URL: "",

  ENDPOINTS: {
    symptomAnalyze: "/symptom/analyze",
    chat: "/chat/",
    skinAnalyze: "/skin/analyze",
    bmiCalculate: "/bmi/calculate"
  }
};

/**
 * Tries the configured backend and returns parsed JSON, or null if the
 * backend isn't configured, times out, or fails for any reason.
 */
async function tryBackend(path, options) {
  if (!CONFIG.BACKEND_URL) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(CONFIG.BACKEND_URL + path, {
      signal: controller.signal,
      ...options
    });

    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    // Network error, timeout, or bad JSON - just fall back locally.
    return null;
  }
}

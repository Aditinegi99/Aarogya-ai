# AarogyaAI

Early AI health guidance for rural and underserved communities — a symptom
checker, AI health chat (text + voice), a skin screening tool, a BMI
calculator, and PDF health summaries, all in one lightweight page.

No backend, build step, or install is required to run it. It's a static
site: plain HTML, CSS, and vanilla JavaScript.

## Features

- **Symptom Checker** — bilingual (English / Hindi / Hinglish) rule-based
  triage with automatic emergency escalation on red-flag symptoms.
- **AI Health Chat** — text and voice (Web Speech API), backed by the same
  triage engine as the symptom checker, with crisis-safe responses if
  self-harm language is detected.
- **Skin Screening** — a prototype visual screening tool that looks at
  color/texture patterns in an uploaded photo. Clearly labeled as a
  prototype, not a diagnosis.
- **Blood Report Analyzer** — checks manually entered lab values (Hb,
  fasting sugar, cholesterol, BP) against standard reference ranges.
- **BMI Calculator** — instant, fully offline.
- **PDF Export** — every tool result can be downloaded as a PDF summary.
- **Emergency section** — one-tap `tel:` links for local emergency numbers.
- Dark mode, mobile-friendly navigation, and a live session dashboard.

## Running it locally

Because it's a static site, any of these work:

```bash
# Option 1 - just open it
open index.html          # macOS
start index.html         # Windows

# Option 2 - a local dev server (recommended, needed for microphone access)
npx serve .
# or, if you installed the dev dependency below:
npm run dev
```

Opening the file directly works for everything except voice input — most
browsers only grant microphone access over `http(s)://` or `localhost`,
not `file://`. Use a local server (or the VS Code "Live Server" extension)
if you want to test voice.

## Project structure

```
aarogya-ai/
├── index.html              # Markup for every section of the page
├── css/
│   └── style.css           # Single stylesheet, organized section-by-section
├── js/
│   ├── config.js           # <- backend / API connection point (see below)
│   ├── utils.js             # shared helpers (toast, escapeHtml, sleep, ...)
│   ├── theme.js              # dark/light mode toggle
│   ├── navigation.js         # mobile menu, smooth-scroll buttons
│   ├── knowledge-base.js     # bilingual symptom keywords + triage rules
│   ├── dashboard.js          # live session stat counters
│   ├── symptom-checker.js    # symptom checker UI
│   ├── chat.js               # chat engine + chat window UI
│   ├── voice.js              # speech-to-text / text-to-speech
│   ├── bmi-calculator.js     # BMI calculator
│   ├── skin-analysis.js      # canvas-based skin screening heuristic
│   ├── blood-report.js       # reference-range blood value checker
│   ├── pdf-export.js         # jsPDF-based summary downloads
│   ├── auth.js                # demo login/signup (localStorage only)
│   └── app.js                 # loading screen + global error handling
└── assets/
    └── favicon.svg
```

Scripts are loaded as plain `<script>` tags (no bundler, no build step) in
the order listed above. They share the page's global scope on purpose —
it keeps the project simple to read, edit, and deploy anywhere static
files are served.

## Connecting a real backend

Every "Analyze" action currently runs entirely in the browser so the site
is fully usable out of the box. To connect your own backend or AI API,
open **`js/config.js`**:

```js
const CONFIG = {
  BACKEND_URL: "https://your-api.example.com", // <- set this
  ENDPOINTS: {
    symptomAnalyze: "/symptom/analyze",
    chat: "/chat/",
    skinAnalyze: "/skin/analyze",
    bmiCalculate: "/bmi/calculate"
  }
};
```

Once `BACKEND_URL` is set, each feature tries your backend first and only
falls back to the built-in local logic if the request fails or times out.
No other files need to change.

Things worth knowing before you wire up a production backend:

- The symptom checker and chat expect a JSON POST body of the shape sent
  in `symptom-checker.js` / `chat.js` and a JSON response with the same
  keys used in `knowledge-base.js`'s return values (`possible_condition`,
  `risk_level`, `recommended_doctor`, `guidance`, `emergency`).
- The blood report tool intentionally does **not** fake OCR of uploaded
  files — wiring up real report parsing (OCR + lab-value extraction) is
  left to your backend, since presenting invented lab values would be
  unsafe.
- The skin screening tool is a basic color-heuristic prototype, not a
  trained model. Swap `analyzeImageHeuristic()` in `skin-analysis.js` for
  a real call to an image-classification endpoint when you have one.

## Disclaimer

AarogyaAI provides general, AI-assisted health information. It is not a
substitute for professional medical advice, diagnosis, or treatment, and
it is not an emergency service. In a medical emergency, contact local
emergency services immediately.

## License

MIT — see [LICENSE](LICENSE).

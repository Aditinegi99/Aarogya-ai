/**
 * skin-analysis.js
 * ----------------
 * A prototype visual screening tool - NOT a trained ML model and NOT a
 * diagnosis. It samples the uploaded photo on a canvas and looks at
 * simple color/texture signals (redness ratio, luminance variance) to
 * give a cautious, clearly-labeled screening note.
 *
 * To upgrade this to a real model: replace analyzeImageHeuristic() with
 * a call to your own image-classification backend via CONFIG.BACKEND_URL
 * (the tryBackend() call below already sends the request - just add the
 * FormData body with the file once your endpoint is ready).
 */

const skinUpload = document.getElementById('skin-upload');
const skinPreviewWrap = document.getElementById('skin-preview-wrap');
const skinPreviewImg = document.getElementById('skin-preview-img');

let skinImageEl = null;
let lastSkinResult = null;

skinUpload.addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  skinPreviewImg.src = url;
  skinPreviewWrap.style.display = 'block';
  document.getElementById('skin-result').style.display = 'none';
  document.getElementById('skin-result-actions').style.display = 'none';

  const img = new Image();
  img.onload = () => {
    skinImageEl = img;
  };
  img.src = url;
});

function analyzeImageHeuristic(img) {
  const canvas = document.createElement('canvas');
  const size = 120;
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, size, size);

  let data;
  try {
    data = ctx.getImageData(0, 0, size, size).data;
  } catch (err) {
    return null;
  }

  let rSum = 0, gSum = 0, bSum = 0, count = 0, rednessPixels = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    rSum += r;
    gSum += g;
    bSum += b;
    count++;
    if (r > 140 && r - g > 25 && r - b > 25) rednessPixels++;
  }

  const avgR = rSum / count, avgG = gSum / count, avgB = bSum / count;
  const rednessRatio = rednessPixels / count;

  let variance = 0;
  for (let i = 0; i < data.length; i += 4) {
    const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
    variance += Math.pow(lum - (avgR + avgG + avgB) / 3, 2);
  }
  variance = variance / count;

  return { avgR, avgG, avgB, rednessRatio, variance };
}

document.getElementById('analyze-skin-btn').addEventListener('click', async function () {
  if (!skinImageEl) {
    toast('Please wait for the image to finish loading, then try again.', 'warn');
    return;
  }

  const btn = this;
  btn.disabled = true;
  btn.innerHTML = 'Analyzing...';

  // A real backend would receive the file as FormData here.
  const backendResult = await tryBackend(CONFIG.ENDPOINTS.skinAnalyze, { method: 'POST' });
  await sleep(600);

  let result;
  if (backendResult) {
    result = backendResult;
  } else {
    const stats = analyzeImageHeuristic(skinImageEl);
    if (!stats) {
      toast('Could not read that image. Please try a different photo.', 'error');
      btn.disabled = false;
      btn.textContent = 'Analyze Skin';
      return;
    }
    result = buildSkinScreeningResult(stats);
  }

  btn.disabled = false;
  btn.textContent = 'Analyze Skin';
  lastSkinResult = result;
  renderSkinResult(result);
  incrementStat('skin');
});

function buildSkinScreeningResult(stats) {
  if (stats.rednessRatio > 0.18) {
    return {
      prediction: 'Notable redness / inflammation pattern detected',
      confidence: 'Prototype screening — not a clinical confidence score',
      severity: stats.rednessRatio > 0.35 ? 'Moderate–High' : 'Mild–Moderate',
      causes: 'Possible irritation, allergic reaction, insect bite, or inflammatory skin condition',
      recommendation:
        "Keep the area clean and avoid scratching or new products on it. See a dermatologist if it spreads, blisters, or doesn't improve within a few days.",
      doctor: 'Dermatologist'
    };
  }
  if (stats.rednessRatio > 0.06) {
    return {
      prediction: 'Mild redness detected',
      confidence: 'Prototype screening — not a clinical confidence score',
      severity: 'Mild',
      causes: 'Could be minor irritation, dryness, or early-stage reaction',
      recommendation: 'Monitor over the next 2–3 days, keep the area moisturised and avoid harsh soaps. See a dermatologist if it worsens.',
      doctor: 'Dermatologist (if it persists)'
    };
  }
  return {
    prediction: 'No significant redness pattern detected',
    confidence: 'Prototype screening — not a clinical confidence score',
    severity: 'Low',
    causes: 'No strong visual indicators found in this screening',
    recommendation: 'If you still have a concern (itching, pain, or changes over time) not visible from color alone, please get it examined in person.',
    doctor: 'Dermatologist, if concerned'
  };
}

function renderSkinResult(result) {
  const resEl = document.getElementById('skin-result');
  resEl.style.display = 'block';
  resEl.innerHTML =
    `<p><strong>Observation:</strong> ${escapeHtml(result.prediction)}</p>` +
    `<p><strong>Confidence:</strong> ${escapeHtml(String(result.confidence))}</p>` +
    `<p><strong>Severity (visual estimate):</strong> ${escapeHtml(result.severity)}</p>` +
    `<p><strong>Possible cause:</strong> ${escapeHtml(result.causes)}</p>` +
    `<p><strong>Recommendation:</strong> ${escapeHtml(result.recommendation)}</p>` +
    `<p><strong>Suggested specialist:</strong> ${escapeHtml(result.doctor)}</p>` +
    `<div class="disclaimer-box yellow" style="margin-top:12px;">⚠ This is a prototype visual screening based on color/texture patterns only — it is not a confirmed medical diagnosis. Please see a dermatologist for a proper assessment.</div>`;
  document.getElementById('skin-result-actions').style.display = 'flex';
}

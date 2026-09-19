/**
 * symptom-checker.js
 * ------------------
 * UI wiring for the "Disease & Symptom Checker" card. Analysis itself
 * lives in knowledge-base.js so it can also be reused by chat.js.
 */

const symptomInput = document.getElementById('symptom-input');

document.querySelectorAll('#symptom-chips .chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    const word = chip.dataset.word;
    symptomInput.value = symptomInput.value.trim() ? `${symptomInput.value.trim()}, ${word}` : word;
    chip.classList.toggle('active');
    symptomInput.focus();
  });
});

let lastSymptomResult = null;

document.getElementById('analyze-symptoms-btn').addEventListener('click', async function () {
  const text = symptomInput.value.trim();
  if (!text) {
    toast('Please describe your symptoms first.', 'warn');
    return;
  }

  const btn = this;
  btn.disabled = true;
  btn.textContent = 'Analyzing...';

  let result = await tryBackend(CONFIG.ENDPOINTS.symptomAnalyze, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symptoms: text })
  });

  if (!result) {
    await sleep(500); // local analysis is instant - this just avoids a jarring flash
    result = analyzeSymptomText(text);
  }

  btn.disabled = false;
  btn.textContent = 'Analyze Symptoms';

  if (!result) {
    toast("Couldn't identify specific symptoms in that text — try adding a few keywords like fever, cough, or pain.", 'warn');
    return;
  }

  lastSymptomResult = result;
  renderSymptomResult(result);
  incrementStat('chats'); // counts as an AI interaction
});

function renderSymptomResult(result) {
  const wrap = document.getElementById('symptom-result-wrap');
  const grid = document.getElementById('symptom-result-grid');
  wrap.style.display = 'block';

  const riskColor = riskToColor(result.risk_level);

  grid.innerHTML =
    `<div class="result-card" style="border-color:rgba(34,211,238,.3); background:rgba(34,211,238,.08);">
       <div class="k">Possible Condition</div>
       <div class="v" style="color:#0891b2;">${escapeHtml(result.possible_condition)}</div>
     </div>` +
    `<div class="result-card" style="border-color:${riskColor.border}; background:${riskColor.bg};">
       <div class="k">Risk Level</div>
       <div class="v" style="color:${riskColor.text};">${escapeHtml(result.risk_level)}</div>
     </div>` +
    `<div class="result-card" style="border-color:rgba(59,130,246,.3); background:rgba(59,130,246,.08);">
       <div class="k">Recommended Doctor</div>
       <div class="v" style="color:#2563eb;">${escapeHtml(result.recommended_doctor)}</div>
     </div>` +
    `<div class="result-full" style="border-color:rgba(16,185,129,.3); background:rgba(16,185,129,.08); grid-column:1/-1;">
       <div class="k">AI Guidance</div>
       <p style="margin-top:8px; line-height:1.7;">${escapeHtml(result.guidance)}</p>
     </div>` +
    (result.emergency
      ? `<div class="emergency-banner">
           <h4>🚨 Emergency Alert</h4>
           <p>Your symptoms may require immediate medical attention. Please visit the nearest emergency department now.</p>
           <div class="emergency-tel-row">
             <a class="btn btn-solid-red btn-sm" href="tel:108">🚑 Call 108</a>
             <a class="btn btn-outline-red btn-sm" href="tel:112">📞 Call 112</a>
           </div>
         </div>`
      : '');

  wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

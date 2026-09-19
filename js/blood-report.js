/**
 * blood-report.js
 * ---------------
 * Checks manually entered values against standard reference ranges.
 *
 * Note: automatically extracting values from a scanned/uploaded report
 * (OCR) needs a real backend or ML service - this file does not fake
 * that. The uploaded file is only kept as an attachment note for this
 * session. Wire up CONFIG.BACKEND_URL + ENDPOINTS.symptomAnalyze-style
 * OCR endpoint here once you have one.
 */

let lastReportResult = null;

document.getElementById('analyze-report-btn').addEventListener('click', async function () {
  const hb = parseFloat(document.getElementById('report-hb').value);
  const sugar = parseFloat(document.getElementById('report-sugar').value);
  const chol = parseFloat(document.getElementById('report-chol').value);
  const bp = parseFloat(document.getElementById('report-bp').value);
  const file = document.getElementById('report-file-input').files[0];

  if (isNaN(hb) && isNaN(sugar) && isNaN(chol) && isNaN(bp)) {
    toast('Please enter at least one value (or upload a report file to keep for reference).', 'warn');
    return;
  }

  const btn = this;
  btn.disabled = true;
  btn.textContent = 'Analyzing...';
  await sleep(500);
  btn.disabled = false;
  btn.textContent = 'Analyze Report';

  const lines = [];
  let riskFlags = 0;

  if (!isNaN(hb)) {
    const note = hb < 12 ? 'Below typical range — possible mild anemia; consider an iron-rich diet and a doctor visit.' : hb > 17 ? 'Above typical range — worth discussing with a doctor.' : 'Within a typical healthy range.';
    if (hb < 12 || hb > 17) riskFlags++;
    lines.push(`<p><strong>Hemoglobin:</strong> ${hb} g/dL — ${note}</p>`);
  }

  if (!isNaN(sugar)) {
    const note =
      sugar < 70
        ? 'Lower than typical fasting range — could indicate hypoglycemia.'
        : sugar <= 99
        ? 'Within a typical healthy fasting range.'
        : sugar <= 125
        ? 'Slightly elevated (pre-diabetic range) — worth discussing with a doctor.'
        : 'Elevated — please consult a doctor for further evaluation.';
    if (sugar < 70 || sugar > 99) riskFlags++;
    lines.push(`<p><strong>Fasting Blood Sugar:</strong> ${sugar} mg/dL — ${note}</p>`);
  }

  if (!isNaN(chol)) {
    const note = chol < 200 ? 'Within a typical desirable range.' : chol <= 239 ? 'Borderline high — consider dietary changes and a follow-up check.' : 'High — please consult a doctor about your cardiovascular risk.';
    if (chol >= 200) riskFlags++;
    lines.push(`<p><strong>Total Cholesterol:</strong> ${chol} mg/dL — ${note}</p>`);
  }

  if (!isNaN(bp)) {
    const note = bp < 90 ? 'Lower than typical — monitor for dizziness or fatigue.' : bp <= 120 ? 'Within a typical normal range.' : bp <= 139 ? 'Elevated — worth monitoring and discussing with a doctor.' : 'High — please consult a doctor promptly.';
    if (bp > 120) riskFlags++;
    lines.push(`<p><strong>Systolic BP:</strong> ${bp} mmHg — ${note}</p>`);
  }

  const overallRisk = riskFlags === 0 ? 'Low' : riskFlags <= 1 ? 'Mild — worth monitoring' : 'Moderate — recommend a doctor visit';
  const fileNote = file ? `<p style="margin-top:10px; font-size:0.82rem; color:var(--muted-2);">Attached file kept for this session: ${escapeHtml(file.name)}</p>` : '';

  const result = {
    hemoglobin: isNaN(hb) ? '—' : hb,
    blood_sugar: isNaN(sugar) ? '—' : sugar,
    cholesterol: isNaN(chol) ? '—' : chol,
    risk: overallRisk,
    summary: 'This is a reference-range comparison only, not a lab interpretation. Please review these values with your doctor, especially anything flagged above.'
  };
  lastReportResult = result;

  const resEl = document.getElementById('report-result');
  resEl.style.display = 'block';
  resEl.innerHTML =
    lines.join('') +
    `<p style="margin-top:10px;"><strong>Overall:</strong> ${overallRisk} risk indication</p>` +
    `<p style="margin-top:8px; font-size:0.85rem; color:var(--muted);">${result.summary}</p>` +
    fileNote;

  document.getElementById('report-result-actions').style.display = 'flex';
  incrementStat('reports');
});

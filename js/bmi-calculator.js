/**
 * bmi-calculator.js
 * -----------------
 * Standard WHO BMI formula, calculated entirely client-side - no upload,
 * no network call needed unless a backend is configured.
 */

let lastBmiResult = null;

document.getElementById('calc-bmi-btn').addEventListener('click', async function () {
  const heightCm = parseFloat(document.getElementById('bmi-height').value);
  const weightKg = parseFloat(document.getElementById('bmi-weight').value);

  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) {
    toast('Please enter a valid height and weight.', 'warn');
    return;
  }

  const btn = this;
  btn.disabled = true;
  btn.textContent = 'Calculating...';

  let data = await tryBackend(CONFIG.ENDPOINTS.bmiCalculate, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ height: heightCm, weight: weightKg })
  });

  if (!data) {
    await sleep(300);
    data = calculateBmiLocally(heightCm, weightKg);
  }

  btn.disabled = false;
  btn.textContent = 'Calculate BMI';

  document.getElementById('bmi-value').textContent = data.bmi;
  document.getElementById('bmi-value').style.color = data._color || '#10b981';
  document.getElementById('bmi-category').textContent = data.category;
  document.getElementById('bmi-advice').textContent = data.advice;
  document.getElementById('bmi-result-actions').style.display = 'flex';
  lastBmiResult = data;

  document.getElementById('stat-bmi').textContent = data.bmi;
  document.getElementById('stat-bmi-status').textContent = data.category;
});

function calculateBmiLocally(heightCm, weightKg) {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);

  let category, advice, color;
  if (bmi < 18.5) {
    category = 'Underweight';
    advice = 'Consider a nutrient-dense diet with enough calories and protein. If unintentional weight loss continues, please consult a doctor.';
    color = '#38bdf8';
  } else if (bmi < 25) {
    category = 'Healthy Weight';
    advice = 'Great! Keep up a balanced diet and regular activity to maintain this range.';
    color = '#22c55e';
  } else if (bmi < 30) {
    category = 'Overweight';
    advice = 'Small, steady changes help — more vegetables, regular walks, and reduced sugary drinks. Consult a doctor for a personalised plan.';
    color = '#eab308';
  } else {
    category = 'Obese';
    advice = "It's worth discussing a structured weight-management plan with a doctor or dietitian, alongside gradual increases in activity.";
    color = '#ef4444';
  }

  return { bmi: bmi.toFixed(1), category, advice, _color: color };
}

/**
 * knowledge-base.js
 * -----------------
 * Bilingual (English / Hindi / Hinglish) keyword matching and rule-based
 * triage. Shared by the Symptom Checker and the Chat.
 *
 * This is intentionally conservative:
 *  - it never invents a diagnosis,
 *  - it always recommends professional confirmation,
 *  - it escalates clearly and immediately on red-flag combinations.
 */

const SYMPTOM_KEYWORDS = {
  fever: ["fever", "bukhar", "tez bukhar", "temperature", "garmi"],
  cough: ["cough", "khansi", "khaansi"],
  cold: ["cold", "sardi", "nazla", "runny nose", "sneezing", "zukam"],
  headache: ["headache", "sar dard", "sar mein dard", "migraine", "sardard"],
  sore_throat: ["sore throat", "gala dard", "gale mein kharash", "gale me dard"],
  body_pain: ["body pain", "badan dard", "muscle pain", "sharir dard", "kamar dard"],
  fatigue: ["fatigue", "weakness", "thakaan", "kamzori", "tiredness", "tired"],
  chest_pain: ["chest pain", "seene mein dard", "chest tightness", "chest discomfort"],
  breathlessness: [
    "shortness of breath",
    "breathlessness",
    "saans lene mein takleef",
    "saans phoolna",
    "can't breathe",
    "difficulty breathing"
  ],
  nausea: ["nausea", "jee michlana", "matli", "feeling sick"],
  vomiting: ["vomiting", "ulti", "vomit", "throwing up"],
  diarrhea: ["diarrhea", "dast", "loose motion", "loose motions"],
  abdominal_pain: ["stomach pain", "pet dard", "abdominal pain", "pet mein dard"],
  dizziness: ["dizziness", "chakkar", "vertigo", "lightheaded"],
  rash: ["rash", "khujli", "itching", "skin rash", "red spots", "daane", "allergy on skin"],
  joint_pain: ["joint pain", "jodo dard", "jodo mein dard", "arthritis pain", "ghutno mein dard"],
  palpitations: ["palpitations", "dil dhadakna", "heart racing", "dil ki dhadkan"],
  burning_urination: ["burning urination", "peshab mein jalan", "burning while urinating", "uti"],
  high_fever_days: ["3 days fever", "teen din se bukhar", "fever for 3 days", "fever since many days", "fever for a week"],
  unconsciousness: ["unconscious", "fainted", "behosh", "collapsed", "passed out"],
  bleeding: ["heavy bleeding", "severe bleeding", "khoon beh raha", "bleeding a lot"],
  paralysis: ["paralysis", "face drooping", "one side weakness", "lakwa", "chehra tedha", "slurred speech", "stroke"],
  allergic_reaction: ["swelling of face", "throat swelling", "severe allergic reaction", "anaphylaxis", "face is swelling"]
};

const CRISIS_KEYWORDS = [
  "suicide",
  "kill myself",
  "end my life",
  "want to die",
  "no reason to live",
  "self harm",
  "harm myself",
  "end it all"
];

const MENTAL_HEALTH_KEYWORDS = ["stress", "anxious", "anxiety", "depressed", "depression", "lonely", "overwhelmed", "panic attack"];

/** Returns a Set of canonical symptom tags found in free text (English/Hindi/Hinglish). */
function detectSymptoms(text) {
  const lower = ' ' + text.toLowerCase() + ' ';
  const found = new Set();

  Object.keys(SYMPTOM_KEYWORDS).forEach((tag) => {
    SYMPTOM_KEYWORDS[tag].forEach((keyword) => {
      if (lower.includes(keyword.toLowerCase())) found.add(tag);
    });
  });

  return found;
}

/**
 * Runs the symptom text through the triage rules and returns a result
 * object, or null if nothing usable was detected.
 */
function analyzeSymptomText(text) {
  const s = detectSymptoms(text);
  const has = (...tags) => tags.some((t) => s.has(t));
  const hasAll = (...tags) => tags.every((t) => s.has(t));

  // 1. Emergency red flags first - these short-circuit everything else.
  if (has('unconsciousness') || has('paralysis') || has('bleeding') || has('allergic_reaction') || (has('chest_pain') && has('breathlessness'))) {
    return {
      possible_condition: 'Potential Medical Emergency',
      risk_level: 'Critical',
      recommended_doctor: 'Emergency Medicine — go to the nearest ER now',
      guidance:
        'These signs can indicate a medical emergency. Please go to the nearest emergency department or call an ambulance immediately. Do not wait or self-treat.',
      emergency: true
    };
  }

  if (has('breathlessness')) {
    return {
      possible_condition: 'Breathing Difficulty — needs urgent evaluation',
      risk_level: 'High',
      recommended_doctor: 'Emergency Medicine / Pulmonologist',
      guidance: 'Difficulty breathing should be assessed urgently. If it is severe or getting worse, go to the nearest emergency department now.',
      emergency: true
    };
  }

  if (has('chest_pain')) {
    return {
      possible_condition: 'Chest Pain — needs prompt evaluation',
      risk_level: 'High',
      recommended_doctor: 'Cardiologist (urgent)',
      guidance:
        'Chest pain should never be ignored, even if mild. Please seek prompt medical evaluation today, especially if it spreads to your arm/jaw, or comes with sweating or breathlessness.',
      emergency: false
    };
  }

  // 2. Common structured conditions.
  if (has('high_fever_days') && (has('body_pain') || has('joint_pain') || has('rash'))) {
    return {
      possible_condition: 'Possible Dengue / Typhoid — needs a blood test',
      risk_level: 'High',
      recommended_doctor: 'General Physician (urgent)',
      guidance:
        'Fever lasting several days with body ache or rash should be checked with a CBC/blood test soon. Stay well hydrated, avoid aspirin/ibuprofen unless a doctor says otherwise, and seek care within 24 hours.',
      emergency: false
    };
  }

  if (hasAll('abdominal_pain', 'vomiting') || hasAll('abdominal_pain', 'diarrhea') || hasAll('vomiting', 'diarrhea')) {
    return {
      possible_condition: 'Possible Gastroenteritis / Stomach Infection',
      risk_level: 'Moderate',
      recommended_doctor: 'General Physician',
      guidance:
        'Sip ORS/fluids frequently to avoid dehydration and eat light, bland food. See a doctor promptly if you notice blood, high fever, or symptoms lasting more than 2 days.',
      emergency: false
    };
  }

  if (has('fever') && has('cough') && (has('sore_throat') || has('cold'))) {
    return {
      possible_condition: 'Common Cold / Viral Upper Respiratory Infection',
      risk_level: 'Mild to Moderate',
      recommended_doctor: 'General Physician',
      guidance: 'Rest, warm fluids, and steam inhalation usually help. See a doctor if fever crosses 102°F, lasts beyond 3 days, or breathing becomes difficult.',
      emergency: false
    };
  }

  if (has('fever') && (has('body_pain') || has('headache')) && has('fatigue')) {
    return {
      possible_condition: 'Viral Fever / Possible Flu',
      risk_level: 'Moderate',
      recommended_doctor: 'General Physician',
      guidance:
        'Stay hydrated, rest, and monitor your temperature. Use fever medicine only as directed by a doctor or pharmacist, and seek care if symptoms persist beyond 3 days or worsen.',
      emergency: false
    };
  }

  if (has('headache') && has('dizziness')) {
    return {
      possible_condition: 'Possible Tension Headache, Migraine, or BP-related Cause',
      risk_level: 'Moderate',
      recommended_doctor: 'General Physician / Neurologist',
      guidance: 'Rest in a quiet, dim space, stay hydrated, and check your blood pressure if possible. See a doctor if this is recurring, severe, or new for you.',
      emergency: false
    };
  }

  if (has('rash')) {
    return {
      possible_condition: 'Possible Skin Allergy or Dermatitis',
      risk_level: 'Mild to Moderate',
      recommended_doctor: 'Dermatologist',
      guidance:
        "Avoid scratching and known irritants, keep the area clean and dry. Try the Skin Screening AI tool below for a closer look, and see a dermatologist if it spreads or doesn't improve in a few days.",
      emergency: false
    };
  }

  if (has('joint_pain')) {
    return {
      possible_condition: 'Possible Joint Inflammation',
      risk_level: 'Moderate',
      recommended_doctor: 'Orthopedist',
      guidance: "Rest the joint, apply a warm compress, and avoid strain. See a doctor if there's swelling, redness, or the pain persists beyond a week.",
      emergency: false
    };
  }

  if (has('burning_urination')) {
    return {
      possible_condition: 'Possible Urinary Tract Infection',
      risk_level: 'Moderate',
      recommended_doctor: 'General Physician',
      guidance:
        "Drink plenty of water and avoid holding urine for long. A urine test and doctor's consultation are recommended, especially if there's fever or back pain.",
      emergency: false
    };
  }

  if (has('palpitations')) {
    return {
      possible_condition: 'Possible Cardiac Rhythm Concern',
      risk_level: 'Moderate to High',
      recommended_doctor: 'Cardiologist',
      guidance: 'Avoid caffeine and stress, and get an ECG checked, especially if this happens often or with chest discomfort.',
      emergency: false
    };
  }

  if (has('fatigue') && s.size <= 2) {
    return {
      possible_condition: 'General Fatigue — possibly lifestyle or diet related',
      risk_level: 'Mild',
      recommended_doctor: 'General Physician',
      guidance: 'Review your sleep, diet and hydration. If fatigue is persistent or unexplained, a basic blood test (including hemoglobin) is a good next step.',
      emergency: false
    };
  }

  if (has('cough') && s.size <= 2) {
    return {
      possible_condition: 'Mild Cough / Bronchial Irritation',
      risk_level: 'Mild',
      recommended_doctor: 'General Physician',
      guidance: 'Warm fluids, steam inhalation and rest usually help. See a doctor if the cough lasts more than 2 weeks or brings up blood.',
      emergency: false
    };
  }

  if (s.size === 0) {
    return null; // Nothing recognizable - let the caller ask for more detail.
  }

  return {
    possible_condition: 'Non-specific Symptoms',
    risk_level: 'Low to Moderate',
    recommended_doctor: 'General Physician',
    guidance: 'Keep track of how your symptoms change over the next 24–48 hours. If they worsen, persist, or new symptoms appear, please consult a doctor.',
    emergency: false
  };
}

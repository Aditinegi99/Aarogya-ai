/**
 * chat.js
 * -------
 * Free-text chat. Handles greetings/small talk directly, checks for
 * mental-health crisis language first (always, before anything else),
 * and otherwise falls back to the same symptom engine used by the
 * Symptom Checker so health questions still get a useful answer.
 */

function chatReply(rawText) {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  if (CRISIS_KEYWORDS.some((k) => lower.includes(k))) {
    return {
      text:
        "I'm really glad you told me this, and I want you to be safe. Please reach out to someone right now — you can call the KIRAN mental health helpline at 1800-599-0019 (toll-free, 24/7) or the Vandrevala Foundation helpline at 1860-2662-345 in India, or go to your nearest hospital. If you're in immediate danger, please call 112 now. You don't have to go through this alone.",
      emergency: true
    };
  }

  if (MENTAL_HEALTH_KEYWORDS.some((k) => lower.includes(k))) {
    return {
      text:
        "That sounds genuinely hard, and it's okay to feel this way. Try to talk to someone you trust, get some rest, and consider light activity like a short walk. If this feeling persists, please consider speaking with a counsellor or calling the KIRAN helpline (1800-599-0019, toll-free). Would you like to tell me a bit more about what's been going on?",
      emergency: false
    };
  }

  if (/^(hi|hello|hey|namaste|namaskar)\b/.test(lower)) {
    return {
      text: "Hi there 👋 I'm AarogyaAI. You can tell me your symptoms, ask general health questions, or use the tools on this page (Symptom Checker, BMI, Skin Screening). How are you feeling today?",
      emergency: false
    };
  }

  if (lower.includes('thank') || lower.includes('shukriya') || lower.includes('dhanyawad')) {
    return { text: "You're welcome! Take care of yourself, and don't hesitate to come back if anything changes.", emergency: false };
  }

  if (lower.includes('who are you') || lower.includes('what is aarogya') || lower.includes('what can you do')) {
    return {
      text: "I'm AarogyaAI — an early AI health guidance assistant built for rural and underserved communities. I can help you think through symptoms, suggest which kind of doctor to see, screen a skin concern, check your BMI, and put together a PDF summary you can carry with you. I give general guidance only, not a diagnosis.",
      emergency: false
    };
  }

  if (/\b(dose|dosage|how many mg|tablet|medicine)\b/.test(lower)) {
    return {
      text: "I can't give specific medicine names or dosages — that really needs a doctor or pharmacist who knows your history. What I can do is help you understand your symptoms and point you to the right kind of specialist. Want to describe how you're feeling?",
      emergency: false
    };
  }

  if (/\b(diet|food|eat)\b/.test(lower)) {
    return {
      text: "A simple, balanced approach works well for most people: plenty of water, vegetables and fruit, whole grains, and lean protein, with light meals if you're unwell. If you have a specific condition (like diabetes or high BP), it's best to get diet advice tailored to you from a doctor or dietitian.",
      emergency: false
    };
  }

  if (/\b(sleep|insomnia)\b/.test(lower)) {
    return {
      text: "Aim for 7–8 hours a night, try to keep a consistent sleep/wake time, and avoid screens right before bed. If poor sleep continues for more than a couple of weeks, it's worth mentioning to a doctor.",
      emergency: false
    };
  }

  if (/\b(exercise|workout|walk)\b/.test(lower)) {
    return {
      text: 'Even 20–30 minutes of walking most days can meaningfully improve energy, heart health and mood. Start gently if you\'re unwell or unfit, and check with a doctor first if you have a heart or joint condition.',
      emergency: false
    };
  }

  // Fall back to the shared symptom engine so free-text health questions are still useful.
  const analysis = analyzeSymptomText(text);
  if (analysis) {
    const reply = `Based on what you've described, this could be: ${analysis.possible_condition}. Risk level: ${analysis.risk_level}. Suggested: ${analysis.recommended_doctor}. ${analysis.guidance}`;
    return { text: reply, emergency: !!analysis.emergency };
  }

  return {
    text: "I want to make sure I understand — could you tell me more about your main symptom (for example fever, pain, cough, or how long it's been going on)? You can also try the Symptom Checker above for a structured analysis.",
    emergency: false
  };
}

const chatWindow = document.getElementById('chat-window');
const chatEmpty = document.getElementById('chat-empty');
const chatInput = document.getElementById('chat-input');

function addChatMessage(sender, text, emergency) {
  if (chatEmpty) chatEmpty.style.display = 'none';

  const div = document.createElement('div');
  div.className = 'msg ' + sender + (emergency ? ' emergency' : '');
  div.textContent = text;

  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

async function sendChat() {
  const text = chatInput.value.trim();
  if (!text) return;

  addChatMessage('user', text, false);
  chatInput.value = '';
  incrementStat('chats');

  const thinking = document.createElement('div');
  thinking.className = 'msg bot';
  thinking.textContent = 'Thinking...';
  chatWindow.appendChild(thinking);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  const backendResult = await tryBackend(CONFIG.ENDPOINTS.chat, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: text })
  });

  let reply, emergency;
  if (backendResult && backendResult.reply) {
    reply = backendResult.reply.replace(/\*/g, '');
    emergency = !!backendResult.emergency;
  } else {
    await sleep(400);
    const r = chatReply(text);
    reply = r.text;
    emergency = r.emergency;
  }

  thinking.remove();
  addChatMessage('bot', reply, emergency);
  speak(reply); // defined in voice.js
}

document.getElementById('chat-send-btn').addEventListener('click', sendChat);
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendChat();
});

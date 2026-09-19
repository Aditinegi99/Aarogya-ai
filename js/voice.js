/**
 * voice.js
 * --------
 * Speech-to-text (SpeechRecognition) and text-to-speech (speechSynthesis).
 * Best supported in Chrome/Edge; falls back to a friendly message
 * elsewhere. Recognized speech is routed into the same chat pipeline as
 * typed messages.
 */

let recognition = null;
let isListening = false;

const voiceBtn = document.getElementById('voice-btn');
const voiceIconCircle = document.getElementById('voice-icon-circle');
const voiceStatusText = document.getElementById('voice-status-text');

function speak(text) {
  if (!('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/\*/g, ''));
    const voices = window.speechSynthesis.getVoices();

    const preferredVoice =
      voices.find((v) => /female|zira|aria|sonia/i.test(v.name)) ||
      voices.find((v) => v.lang === 'en-IN') ||
      voices.find((v) => v.lang && v.lang.startsWith('en')) ||
      voices[0];

    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.lang = /[\u0900-\u097F]/.test(text) ? 'hi-IN' : 'en-IN';
    utterance.rate = 1;
    utterance.pitch = 1.05;
    utterance.volume = 1;

    // Some browsers need a beat before voices are ready right after page load.
    setTimeout(() => window.speechSynthesis.speak(utterance), 150);
  } catch (err) {
    // Speech synthesis is a nice-to-have - never let it break the chat.
  }
}

if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}

function stopVoice() {
  isListening = false;
  if (recognition) {
    recognition.onend = null;
    try {
      recognition.stop();
    } catch (err) {
      /* already stopped */
    }
  }
  voiceIconCircle.classList.remove('listening');
  voiceStatusText.textContent = 'Tap to start speaking';
  voiceBtn.textContent = '🎤 Start Speaking';
  voiceBtn.className = 'btn btn-solid-cyan';
}

function startVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    toast('Speech recognition is not supported in this browser. Try Chrome or Edge, or type your message instead.', 'warn');
    return;
  }

  if (recognition) {
    try {
      recognition.stop();
    } catch (err) {
      /* ignore */
    }
  }

  recognition = new SpeechRecognition();
  recognition.lang = 'en-IN';
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  isListening = true;
  voiceIconCircle.classList.add('listening');
  voiceStatusText.textContent = 'Listening...';
  voiceBtn.textContent = '⏹ Stop Speaking';
  voiceBtn.className = 'btn btn-solid-red';

  try {
    recognition.start();
  } catch (err) {
    /* ignore - onerror below will reset UI state */
  }

  recognition.onresult = (event) => {
    const result = event.results[event.results.length - 1];
    if (!result.isFinal) return;

    const text = result[0].transcript.trim();
    if (text.length > 0) {
      addChatMessage('user', text, false);
      incrementStat('chats');
      const r = chatReply(text);
      addChatMessage('bot', r.text, r.emergency);
      speak(r.text);
      goTo('chat');
    }
  };
  recognition.onerror = () => stopVoice();
  recognition.onend = () => {
    if (isListening) stopVoice();
  };
}

voiceBtn.addEventListener('click', () => (isListening ? stopVoice() : startVoice()));

/**
 * dashboard.js
 * ------------
 * Tracks how many times each tool has been used this session and reflects
 * it on the dashboard stat cards. Purely client-side - resets on reload.
 */

const sessionStats = { skin: 0, reports: 0, chats: 0 };

function incrementStat(key) {
  sessionStats[key] = (sessionStats[key] || 0) + 1;
  const el = document.getElementById('stat-' + key);
  if (el) el.textContent = sessionStats[key];
}

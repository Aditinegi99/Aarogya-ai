/**
 * utils.js
 * --------
 * Small helpers shared by more than one feature module. Nothing in here
 * depends on any other file, so it's safe to load first.
 */

/** Shows a small dismissible toast in the bottom corner. kind: 'info' | 'warn' | 'error' */
function toast(message, kind) {
  const stack = document.getElementById('toast-stack');
  const el = document.createElement('div');
  el.className = 'toast';
  el.style.borderLeft = '4px solid ' + (kind === 'error' ? '#ef4444' : kind === 'warn' ? '#eab308' : '#06b6d4');
  el.textContent = message;
  stack.appendChild(el);

  setTimeout(() => {
    el.style.transition = 'opacity .3s ease';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 320);
  }, 3800);
}

/** Escapes text before it's dropped into innerHTML. */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/** Promise-based delay, used to make instant local results feel like they were "thinking". */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Maps a risk-level string to a border/background/text color triple. */
function riskToColor(level) {
  const l = level.toLowerCase();
  if (l.includes('critical') || l.includes('high')) {
    return { border: 'rgba(239,68,68,.35)', bg: 'rgba(239,68,68,.1)', text: '#dc2626' };
  }
  if (l.includes('moderate')) {
    return { border: 'rgba(234,179,8,.35)', bg: 'rgba(234,179,8,.1)', text: '#b45309' };
  }
  return { border: 'rgba(34,197,94,.35)', bg: 'rgba(34,197,94,.1)', text: '#16a34a' };
}

/** Smooth-scrolls to any section by id. */
function goTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * theme.js
 * --------
 * Light/dark theme toggle. Respects the visitor's OS preference by default
 * and remembers an explicit choice in localStorage.
 */

const root = document.documentElement;
const themeIcon = document.getElementById('theme-icon');

function applyThemeIcon() {
  const isDark =
    root.getAttribute('data-theme') === 'dark' ||
    (!root.getAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  themeIcon.textContent = isDark ? '☀️' : '🌙';
}

(function initTheme() {
  try {
    const saved = localStorage.getItem('aarogya-theme');
    if (saved) root.setAttribute('data-theme', saved);
  } catch (err) {
    // localStorage unavailable (private browsing etc.) - just use OS preference.
  }
  applyThemeIcon();
})();

document.getElementById('theme-toggle').addEventListener('click', () => {
  const isDark =
    root.getAttribute('data-theme') === 'dark' ||
    (!root.getAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const next = isDark ? 'light' : 'dark';

  root.setAttribute('data-theme', next);
  try {
    localStorage.setItem('aarogya-theme', next);
  } catch (err) {
    /* ignore */
  }
  applyThemeIcon();
});

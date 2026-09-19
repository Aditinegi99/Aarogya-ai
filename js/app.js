/**
 * app.js
 * ------
 * Loaded last. Handles the splash/loading screen and a global error
 * safety net so one unexpected error never breaks the rest of the page.
 */

window.addEventListener('load', () => {
  setTimeout(() => document.getElementById('loading-screen').classList.add('hide'), 900);
});

// Belt-and-braces: hide the loading screen even if the 'load' event is slow/missed.
setTimeout(() => document.getElementById('loading-screen').classList.add('hide'), 3500);

window.addEventListener('error', (evt) => {
  console.error('AarogyaAI runtime error (non-fatal):', evt.error || evt.message);
});

window.addEventListener('unhandledrejection', (evt) => {
  console.error('AarogyaAI unhandled promise rejection (non-fatal):', evt.reason);
});

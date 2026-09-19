/**
 * auth.js
 * -------
 * Demo login/signup, stored only in the visitor's own browser
 * (localStorage). This exists so the "Login" / "Create Free Account"
 * buttons aren't dead ends while you build a real auth backend -
 * swap this out for real API calls to CONFIG.BACKEND_URL when ready.
 */

const authModal = document.getElementById('auth-modal');
const authForm = document.getElementById('auth-form');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const signupNameField = document.getElementById('signup-name-field');

let authMode = 'login';

function openAuthModal(mode) {
  authMode = mode || 'login';
  document.querySelectorAll('.modal-tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === authMode));
  signupNameField.style.display = authMode === 'signup' ? 'block' : 'none';
  authSubmitBtn.textContent = authMode === 'signup' ? 'Create Account' : 'Login';
  authModal.classList.add('open');
  document.getElementById('auth-email').focus();
}

function closeAuthModal() {
  authModal.classList.remove('open');
}

['open-login', 'open-login-mobile'].forEach((id) => {
  document.getElementById(id).addEventListener('click', () => {
    closeMobileMenu();
    openAuthModal('login');
  });
});

document.getElementById('cta-create-account').addEventListener('click', () => openAuthModal('signup'));
document.getElementById('auth-modal-close').addEventListener('click', closeAuthModal);

authModal.addEventListener('click', (e) => {
  if (e.target === authModal) closeAuthModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeAuthModal();
    closeMobileMenu();
  }
});

document.querySelectorAll('.modal-tab').forEach((tab) => {
  tab.addEventListener('click', () => openAuthModal(tab.dataset.tab));
});

authForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const name = document.getElementById('auth-name').value.trim();

  if (!email || !password) {
    toast('Please fill in email and password.', 'warn');
    return;
  }

  try {
    const usersRaw = localStorage.getItem('aarogya-users');
    const users = usersRaw ? JSON.parse(usersRaw) : {};

    if (authMode === 'signup') {
      users[email] = { name: name || email.split('@')[0], password };
      localStorage.setItem('aarogya-users', JSON.stringify(users));
      localStorage.setItem('aarogya-current-user', email);
      toast(`Account created! Welcome, ${name || email.split('@')[0]}.`);
    } else {
      if (users[email] && users[email].password === password) {
        localStorage.setItem('aarogya-current-user', email);
        toast(`Welcome back, ${users[email].name}!`);
      } else {
        toast('No matching demo account found — try Sign Up instead.', 'error');
        return;
      }
    }
  } catch (err) {
    toast('Could not save locally (private browsing mode?), but you can continue using the site.', 'warn');
  }

  closeAuthModal();
  authForm.reset();
});

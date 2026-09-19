/**
 * navigation.js
 * -------------
 * Mobile hamburger menu, every "scroll to section" button on the page,
 * and the back-to-top button.
 */

const menuToggle = document.getElementById('menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');
const menuIcon = document.getElementById('menu-icon');

function closeMobileMenu() {
  mobileMenu.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuIcon.textContent = '☰';
}

menuToggle.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  menuIcon.textContent = open ? '✕' : '☰';
});

document.querySelectorAll('#mobile-menu a').forEach((link) => {
  link.addEventListener('click', closeMobileMenu);
});

// Every button that just needs to scroll somewhere shares the .go-to convention.
document.querySelectorAll('.go-to').forEach((btn) => {
  btn.addEventListener('click', () => goTo(btn.dataset.target));
});

document.getElementById('hero-get-started').addEventListener('click', () => goTo('final-cta'));
document.getElementById('hero-explore').addEventListener('click', () => goTo('features'));
document.getElementById('nav-get-started').addEventListener('click', () => goTo('dashboard'));
document.getElementById('mobile-get-started').addEventListener('click', () => {
  closeMobileMenu();
  goTo('dashboard');
});
document.getElementById('dash-open-doctor').addEventListener('click', () => goTo('chat'));
document.getElementById('cta-explore-dashboard').addEventListener('click', () => goTo('dashboard'));

// The "Recent Reports" cards on the dashboard are sample data, not real uploads.
document.querySelectorAll('.demo-report-view').forEach((btn) => {
  btn.addEventListener('click', () => {
    toast('This is sample dashboard data. Upload your own report below to try real analysis.', 'warn');
    goTo('reports');
  });
});

const backToTop = document.getElementById('back-to-top');
window.addEventListener('scroll', () => {
  backToTop.classList.toggle('show', window.scrollY > 600);
});
backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

document.getElementById('view-sample-plan-btn').addEventListener('click', function () {
  const plan = document.getElementById('sample-plan');
  plan.classList.toggle('open');
  this.textContent = plan.classList.contains('open') ? 'Hide Sample Plan' : 'View Sample Plan';
});

document.getElementById('find-hospital-btn').addEventListener('click', () => {
  window.open('https://www.google.com/maps/search/hospitals+near+me', '_blank', 'noopener');
});

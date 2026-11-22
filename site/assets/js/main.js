const header = document.querySelector('.site-header');
const navigation = document.querySelector('#primary-navigation');
const toggle = document.querySelector('.menu-toggle');
const narrow = matchMedia('(max-width: 1023px)');

if (header && navigation && toggle) {
  const label = toggle.querySelector('.menu-label');
  function setMenu(open, restoreFocus = false) {
    navigation.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    label.textContent = open ? 'Close' : 'Menu';
    if (restoreFocus) toggle.focus();
  }
  toggle.hidden = false;
  document.documentElement.classList.add('menu-ready');
  let lastFocusedControl = null;
  document.addEventListener('focusin', event => {
    lastFocusedControl = navigation.contains(event.target) || event.target === toggle ? event.target : null;
  });
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') setMenu(false, true);
  });
  navigation.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || !narrow.matches) return;
    const target = document.getElementById(link.hash.slice(1));
    setMenu(false);
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  });
  narrow.addEventListener('change', () => {
    // CSS can hide a focused control before the media-query event is delivered.
    const focused = lastFocusedControl || document.activeElement;
    const fromNavigation = navigation.contains(focused);
    const fromToggle = focused === toggle;
    setMenu(false);
    if (narrow.matches && fromNavigation) toggle.focus();
    else if (!narrow.matches && fromToggle) navigation.querySelector('a')?.focus();
  });

  const sections = [...document.querySelectorAll('[data-section]')];
  const links = [...navigation.querySelectorAll('a[href^="#"]')];
  let scheduled = false;
  function updateActiveSection() {
    scheduled = false;
    const threshold = header.getBoundingClientRect().bottom + 48;
    let current = sections[0]?.id;
    for (const section of sections) if (section.getBoundingClientRect().top <= threshold) current = section.id;
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 3) current = sections.at(-1)?.id;
    for (const link of links) {
      if (link.hash === `#${current}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }
  function scheduleUpdate() {
    if (!scheduled) { scheduled = true; requestAnimationFrame(updateActiveSection); }
  }
  addEventListener('scroll', scheduleUpdate, { passive: true });
  addEventListener('resize', scheduleUpdate);
  addEventListener('hashchange', scheduleUpdate);
  updateActiveSection();
}

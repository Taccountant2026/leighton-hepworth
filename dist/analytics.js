'use strict';

(() => {
  const measurementId = 'G-80ZJ15H2XX';
  const storageKey = 'lh_analytics_consent_v1';
  const choiceLifetime = 180 * 24 * 60 * 60 * 1000;
  const production = location.protocol === 'https:' &&
    ['leightonhepworth.com', 'www.leightonhepworth.com'].includes(location.hostname);
  const banner = document.querySelector('#cookie-banner');
  const status = document.querySelector('#cookie-status');
  if (!banner) return;

  let loaded = false;
  let launcher = null;

  function readChoice() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (saved && ['granted', 'denied'].includes(saved.choice) &&
          Number.isFinite(saved.expires) && saved.expires > Date.now()) return saved.choice;
      localStorage.removeItem(storageKey);
    } catch { /* A blocked preference store leaves analytics off until chosen. */ }
    return null;
  }

  function saveChoice(choice) {
    try {
      localStorage.setItem(storageKey, JSON.stringify({choice, expires: Date.now() + choiceLifetime}));
    } catch { /* The current visit can still honour an explicit choice. */ }
  }

  let choice = readChoice();
  window['ga-disable-' + measurementId] = choice !== 'granted';

  function removeAnalyticsCookies() {
    const names = ['_ga', '_ga_' + measurementId.slice(2)];
    const domains = new Set(['', location.hostname, '.' + location.hostname,
      'leightonhepworth.com', '.leightonhepworth.com']);
    for (const name of names) {
      for (const domain of domains) {
        document.cookie = name + '=; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax' +
          (location.protocol === 'https:' ? '; Secure' : '') + (domain ? '; domain=' + domain : '');
      }
    }
  }

  function startAnalytics() {
    if (!production || choice !== 'granted' || loaded) return;
    loaded = true;
    window['ga-disable-' + measurementId] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      analytics_storage: 'denied', ad_storage: 'denied',
      ad_user_data: 'denied', ad_personalization: 'denied'
    });
    window.gtag('consent', 'update', {
      analytics_storage: 'granted', ad_storage: 'denied',
      ad_user_data: 'denied', ad_personalization: 'denied'
    });
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_expires: 90 * 24 * 60 * 60,
      cookie_flags: 'SameSite=Lax;Secure'
    });
    const script = document.createElement('script');
    script.id = 'lh-google-analytics';
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
    document.head.append(script);
  }

  function applyChoice(nextChoice, persist) {
    const wasLoaded = loaded;
    choice = nextChoice;
    if (persist) saveChoice(choice);
    window['ga-disable-' + measurementId] = choice !== 'granted';
    banner.hidden = choice !== null;
    if (choice === 'granted') {
      startAnalytics();
      if (status) status.textContent = 'Analytics accepted. You can change this in Cookie settings.';
    } else {
      removeAnalyticsCookies();
      if (status) status.textContent = choice === 'denied' ? 'Analytics declined.' : 'Choose whether to allow analytics.';
      // Reload after withdrawal so previously loaded Google code is removed too.
      if (wasLoaded) location.reload();
    }
    if (banner.hidden && launcher) {
      launcher.focus({preventScroll: true});
      launcher = null;
    }
  }

  for (const button of document.querySelectorAll('[data-analytics-choice]')) {
    button.addEventListener('click', () => applyChoice(button.dataset.analyticsChoice, true));
  }
  for (const button of document.querySelectorAll('[data-cookie-settings]')) {
    button.addEventListener('click', () => {
      launcher = button;
      banner.hidden = false;
      document.querySelector('#cookie-title')?.focus({preventScroll: true});
    });
  }
  window.addEventListener('storage', event => {
    if (event.key === storageKey || event.key === null) applyChoice(readChoice(), false);
  });

  banner.hidden = choice !== null;
  if (choice === 'granted') startAnalytics();
  else removeAnalyticsCookies();
})();

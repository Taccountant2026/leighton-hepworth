'use strict';

(() => {
  const measurementId = 'G-80ZJ15H2XX';
  const storageKey = 'lh_analytics_consent_v1';
  const choiceLifetime = 180 * 24 * 60 * 60 * 1000;
  const production = location.protocol === 'https:' &&
    ['leightonhepworth.com', 'www.leightonhepworth.com'].includes(location.hostname);

  function readChoice() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (saved && ['granted', 'denied'].includes(saved.choice) &&
          Number.isFinite(saved.expires) && saved.expires > Date.now()) return saved.choice;
      localStorage.removeItem(storageKey);
    } catch { /* A blocked preference store leaves analytics cookies off until chosen. */ }
    return null;
  }

  function saveChoice(nextChoice) {
    try {
      localStorage.setItem(storageKey, JSON.stringify({choice: nextChoice, expires: Date.now() + choiceLifetime}));
    } catch { /* The current visit can still honour an explicit choice. */ }
  }

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

  let choice = readChoice();
  let tagState = 'loading';
  let renderStatus = () => {};
  const consent = () => ({
    analytics_storage: production && choice === 'granted' ? 'granted' : 'denied',
    ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'
  });

  // This file runs synchronously before the standard async Google tag in <head>.
  // Register consent before config, so a new visit cannot create analytics cookies.
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window['ga-disable-' + measurementId] = !production;
  window.gtag('consent', 'default', consent());
  if (choice !== 'granted') removeAnalyticsCookies();
  if (production) {
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_expires: 90 * 24 * 60 * 60,
      cookie_flags: 'SameSite=Lax;Secure'
    });
  }

  // Capture the parser-inserted tag's result, including a fast cached response.
  for (const type of ['load', 'error']) {
    document.addEventListener(type, event => {
      if (event.target?.id !== 'lh-google-analytics') return;
      tagState = type === 'load' ? 'loaded' : 'error';
      renderStatus();
    }, true);
  }

  function initialiseChoiceControls() {
    const banner = document.querySelector('#cookie-banner');
    if (!banner) return;
    const status = document.querySelector('#cookie-status');
    const loadStatus = document.querySelector('#analytics-load-status');
    const retry = document.querySelector('[data-analytics-retry]');
    let launcher = null;

    renderStatus = () => {
      if (loadStatus) loadStatus.textContent = (!production ? 'Analytics measurement is disabled on this preview. ' : '') + (
        tagState === 'loaded' ? 'Google tag loaded.' :
        tagState === 'error' ? 'Google Analytics could not load in this browser. A content blocker or connection problem may be preventing it. Your cookie choice is saved.' :
        'Google tag is loading…');
      if (retry) retry.hidden = !production || tagState !== 'error';
    };

    function applyChoice(nextChoice, persist) {
      choice = nextChoice;
      if (persist) saveChoice(choice);
      if (production) window.gtag('consent', 'update', consent());
      if (choice !== 'granted') removeAnalyticsCookies();
      banner.hidden = choice !== null;
      if (status) status.textContent = choice === 'granted' ? 'Analytics cookies accepted. You can change this in Cookie settings.' :
        choice === 'denied' ? 'Analytics cookies declined.' : 'Choose whether to allow analytics cookies.';
      if (banner.hidden && launcher) {
        launcher.focus({preventScroll: true});
        launcher = null;
      }
      renderStatus();
    }

    for (const button of document.querySelectorAll('[data-analytics-choice]')) {
      button.addEventListener('click', () => applyChoice(button.dataset.analyticsChoice, true));
    }
    for (const button of document.querySelectorAll('[data-cookie-settings]')) {
      button.addEventListener('click', () => {
        launcher = button;
        banner.hidden = false;
        renderStatus();
        document.querySelector('#cookie-title')?.focus({preventScroll: true});
      });
    }
    retry?.addEventListener('click', () => {
      if (!production || tagState !== 'error') return;
      tagState = 'loading';
      renderStatus();
      document.querySelector('#lh-google-analytics')?.remove();
      const script = document.createElement('script');
      script.id = 'lh-google-analytics';
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
      document.head.append(script);
    });
    window.addEventListener('storage', event => {
      if (event.key === storageKey || event.key === null) applyChoice(readChoice(), false);
    });

    banner.hidden = choice !== null;
    renderStatus();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialiseChoiceControls, {once: true});
  } else initialiseChoiceControls();
})();

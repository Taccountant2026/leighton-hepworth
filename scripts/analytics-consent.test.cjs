const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../dist/analytics.js'), 'utf8');
const key = 'lh_analytics_consent_v1';
const id = 'G-80ZJ15H2XX';
const preference = choice => JSON.stringify({choice, expires: Date.now() + 86400000});

// A unit fixture: separate the head bootstrap from DOM readiness and tag loading.
function visit({saved, hostname = 'leightonhepworth.com', protocol = 'https:', blocked = false, head = false} = {}) {
  const storage = new Map(saved === undefined ? [] : [[key, saved]]);
  const scripts = [], cookies = [], events = new Map(), documentEvents = new Map();
  let domReady = false, removedTags = 0;
  function control(dataset = {}) {
    const handlers = new Map();
    return {dataset, hidden: true, textContent: '', focused: false,
      addEventListener(type, fn) { handlers.set(type, fn); },
      click() { handlers.get('click')?.({}); },
      focus() { this.focused = true; }};
  }
  const banner = control(), title = control(), status = control(), loadStatus = control();
  const accept = control({analyticsChoice: 'granted'}), decline = control({analyticsChoice: 'denied'});
  const settings = control(), retry = control();
  const nodes = {'#cookie-banner': banner, '#cookie-title': title, '#cookie-status': status,
    '#analytics-load-status': loadStatus, '[data-analytics-retry]': retry,
    '#lh-google-analytics': {remove() { removedTags++; }}};
  const document = {
    readyState: 'loading',
    addEventListener(type, fn) { documentEvents.set(type, fn); },
    querySelector(selector) { return domReady ? nodes[selector] || null : null; },
    querySelectorAll(selector) {
      return selector === '[data-analytics-choice]' ? [decline, accept] :
        selector === '[data-cookie-settings]' ? [settings] : [];
    },
    createElement(tag) { assert.equal(tag, 'script'); return {}; },
    head: {append(script) { scripts.push(script); }}
  };
  Object.defineProperty(document, 'cookie', {set(value) { cookies.push(value); }});
  const location = {hostname, protocol};
  const window = {location, addEventListener(type, fn) { events.set(type, fn); }};
  const localStorage = {
    getItem(k) { if (blocked) throw new Error('blocked'); return storage.get(k) ?? null; },
    setItem(k, value) { if (blocked) throw new Error('blocked'); storage.set(k, value); },
    removeItem(k) { if (blocked) throw new Error('blocked'); storage.delete(k); }
  };
  vm.runInNewContext(source, {window, document, location, localStorage, Date, JSON, Number, Set});
  const v = {window, banner, title, status, loadStatus, accept, decline, settings, retry, scripts, cookies, storage,
    ready() { domReady = true; document.readyState = 'interactive'; documentEvents.get('DOMContentLoaded')?.(); },
    tagEvent(type, targetId = 'lh-google-analytics') { documentEvents.get(type)?.({target: {id: targetId}}); },
    storageEvent(k = key) { events.get('storage')({key: k}); },
    get removedTags() { return removedTags; },
    commands() { return (window.dataLayer || []).map(args => Array.from(args)); }};
  if (!head) v.ready();
  return v;
}

test('consent defaults and config are registered in head before the page UI exists', () => {
  const v = visit({head: true});
  const commands = v.commands();
  assert.equal(commands[0][0], 'consent');
  assert.equal(commands[0][1], 'default');
  assert.equal(commands[0][2].analytics_storage, 'denied');
  assert.equal(commands[1][0], 'js');
  assert.equal(commands[2][0], 'config');
  assert.equal(commands[2][1], id);
  assert.equal(v.window['ga-disable-' + id], false);
  assert.equal(v.scripts.length, 0, 'use the standard HTML tag, not a duplicate injected script');
  v.ready();
  assert.equal(v.banner.hidden, false);
  assert.ok(v.cookies.every(value => value.includes('Max-Age=0')));
});

test('advertising remains denied and signals are disabled', () => {
  const v = visit(); v.accept.click();
  for (const command of v.commands().filter(command => command[0] === 'consent')) {
    for (const field of ['ad_storage', 'ad_user_data', 'ad_personalization']) assert.equal(command[2][field], 'denied');
  }
  const config = v.commands().find(command => command[0] === 'config');
  assert.equal(config[2].allow_google_signals, false);
  assert.equal(config[2].allow_ad_personalization_signals, false);
  assert.equal(config[2].cookie_expires, 90 * 86400);
});

test('declining persists denied consent and keeps analytics cookies disabled', () => {
  const v = visit(); v.decline.click();
  const saved = JSON.parse(v.storage.get(key));
  assert.equal(saved.choice, 'denied');
  assert.ok(saved.expires > Date.now() + 179 * 86400000);
  assert.equal(v.commands().at(-1)[2].analytics_storage, 'denied');
  assert.equal(v.banner.hidden, true);
  assert.equal(v.commands().filter(command => command[0] === 'config').length, 1);
});

test('accepting updates consent without duplicating the initial config or Google tag', () => {
  const v = visit(); v.accept.click(); v.settings.click(); v.accept.click();
  assert.equal(v.commands().at(-1)[2].analytics_storage, 'granted');
  assert.equal(v.commands().filter(command => command[0] === 'config').length, 1);
  assert.equal(v.scripts.length, 0);
  assert.equal(JSON.parse(v.storage.get(key)).choice, 'granted');
});

test('saved consent is applied before config on both public hostnames', () => {
  for (const hostname of ['leightonhepworth.com', 'www.leightonhepworth.com']) {
    const v = visit({hostname, saved: preference('granted')});
    assert.equal(v.commands()[0][2].analytics_storage, 'granted');
    assert.equal(v.banner.hidden, true);
    assert.equal(v.cookies.length, 0);
  }
});

test('saved refusal defaults to denied without showing the banner again', () => {
  const v = visit({saved: preference('denied')});
  assert.equal(v.commands()[0][2].analytics_storage, 'denied');
  assert.equal(v.banner.hidden, true);
});

test('expired, malformed and unexpected preferences never grant storage', () => {
  for (const saved of ['broken JSON', 'null', '{}', preference('other'),
    JSON.stringify({choice: 'granted', expires: Date.now() - 1})]) {
    const v = visit({saved});
    assert.equal(v.commands()[0][2].analytics_storage, 'denied');
    assert.equal(v.banner.hidden, false);
  }
});

test('previews, hosting aliases and HTTP never configure measurement', () => {
  for (const options of [{hostname: 'terminal.local', protocol: 'http:'},
    {hostname: 'leighton-hepworth.taccountant.chatgpt.site'}, {protocol: 'http:'}]) {
    const v = visit(options); v.accept.click();
    assert.equal(v.window['ga-disable-' + id], true);
    assert.equal(v.commands().filter(command => command[0] === 'config').length, 0);
    assert.equal(v.commands()[0][2].analytics_storage, 'denied');
    assert.match(v.loadStatus.textContent, /disabled on this preview/);
  }
});

test('blocked preference storage defaults denied and honours an explicit choice for this visit', () => {
  const v = visit({blocked: true});
  assert.equal(v.commands()[0][2].analytics_storage, 'denied');
  v.accept.click();
  assert.equal(v.commands().at(-1)[2].analytics_storage, 'granted');
  assert.equal(visit({blocked: true}).commands()[0][2].analytics_storage, 'denied');
});

test('withdrawal updates consent immediately and expires host and parent-domain cookies', () => {
  const v = visit({saved: preference('granted')});
  v.settings.click(); v.decline.click();
  assert.equal(v.commands().at(-1)[2].analytics_storage, 'denied');
  assert.equal(JSON.parse(v.storage.get(key)).choice, 'denied');
  assert.ok(v.cookies.some(value => value.startsWith('_ga_80ZJ15H2XX=; Max-Age=0')));
  assert.ok(v.cookies.some(value => value.includes('domain=.leightonhepworth.com')));
  assert.equal(v.commands().filter(command => command[0] === 'config').length, 1);
});

test('refusal or preference removal in another tab revokes storage consent', () => {
  for (const cleared of [false, true]) {
    const v = visit({saved: preference('granted')});
    if (cleared) v.storage.clear(); else v.storage.set(key, preference('denied'));
    v.storageEvent(cleared ? null : key);
    assert.equal(v.commands().at(-1)[2].analytics_storage, 'denied');
    assert.equal(v.banner.hidden, !cleared);
  }
});

test('cross-tab grants update consent and unrelated storage changes have no effect', () => {
  const v = visit(); v.storage.set(key, preference('granted'));
  v.storageEvent('another-project-setting');
  assert.equal(v.commands().length, 3);
  v.storageEvent();
  assert.equal(v.commands().at(-1)[2].analytics_storage, 'granted');
});

test('Cookie settings restores the choice and returns keyboard focus when saved', () => {
  const v = visit({saved: preference('denied')}); v.settings.click();
  assert.equal(v.banner.hidden, false);
  assert.equal(v.title.focused, true);
  v.decline.click();
  assert.equal(v.banner.hidden, true);
  assert.equal(v.settings.focused, true);
});

test('a fast tag response before DOM readiness is still reported correctly', () => {
  const v = visit({head: true});
  v.tagEvent('load'); v.ready();
  assert.equal(v.loadStatus.textContent, 'Google tag loaded.');
  assert.equal(v.retry.hidden, true);
});

test('failed tag loading is visible and can retry without another page-view config', () => {
  const v = visit(); v.tagEvent('error', 'unrelated-script');
  assert.equal(v.retry.hidden, true);
  v.tagEvent('error');
  assert.match(v.loadStatus.textContent, /could not load/);
  assert.equal(v.retry.hidden, false);
  v.retry.click(); v.retry.click();
  assert.equal(v.scripts.length, 1);
  assert.equal(v.removedTags, 1);
  assert.equal(v.scripts[0].src, 'https://www.googletagmanager.com/gtag/js?id=' + id);
  assert.equal(v.scripts[0].async, true);
  assert.equal(v.commands().filter(command => command[0] === 'config').length, 1);
  assert.equal(v.retry.hidden, true);
  v.tagEvent('load');
  assert.equal(v.loadStatus.textContent, 'Google tag loaded.');
});

test('a failure before DOM readiness also exposes the retry control', () => {
  const v = visit({head: true}); v.tagEvent('error'); v.ready();
  assert.equal(v.retry.hidden, false);
  assert.match(v.loadStatus.textContent, /could not load/);
});

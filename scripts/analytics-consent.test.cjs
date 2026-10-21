const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../dist/analytics.js'), 'utf8');
const key = 'lh_analytics_consent_v1';
const id = 'G-80ZJ15H2XX';
const preference = choice => JSON.stringify({choice, expires: Date.now() + 86400000});

// A unit fixture, not a browser: record attempted tag loads and cookie writes.
function visit({saved, hostname = 'leightonhepworth.com', protocol = 'https:', blocked = false} = {}) {
  const storage = new Map(saved === undefined ? [] : [[key, saved]]);
  const scripts = [], cookies = [], events = new Map();
  let reloads = 0;
  function control(dataset = {}) {
    const handlers = new Map();
    return {dataset, hidden: true, textContent: '', focused: false,
      addEventListener(type, fn) { handlers.set(type, fn); },
      click() { handlers.get('click')?.({}); },
      focus() { this.focused = true; }};
  }
  const banner = control(), title = control(), status = control();
  const accept = control({analyticsChoice: 'granted'});
  const decline = control({analyticsChoice: 'denied'});
  const settings = control();
  const nodes = {'#cookie-banner': banner, '#cookie-title': title, '#cookie-status': status};
  const document = {
    querySelector(selector) { return nodes[selector] || null; },
    querySelectorAll(selector) {
      return selector === '[data-analytics-choice]' ? [decline, accept] :
        selector === '[data-cookie-settings]' ? [settings] : [];
    },
    createElement(tag) { assert.equal(tag, 'script'); return {}; },
    head: {append(script) { scripts.push(script); }}
  };
  Object.defineProperty(document, 'cookie', {set(value) { cookies.push(value); }});
  const location = {hostname, protocol, reload() { reloads++; }};
  const window = {location, addEventListener(type, fn) { events.set(type, fn); }};
  const localStorage = {
    getItem(k) { if (blocked) throw new Error('blocked'); return storage.get(k) ?? null; },
    setItem(k, value) { if (blocked) throw new Error('blocked'); storage.set(k, value); },
    removeItem(k) { if (blocked) throw new Error('blocked'); storage.delete(k); }
  };
  vm.runInNewContext(source, {window, document, location, localStorage, Date, JSON, Number, Set});
  return {window, banner, title, status, accept, decline, settings, scripts, cookies, storage,
    storageEvent(k = key) { events.get('storage')({key: k}); },
    get reloads() { return reloads; },
    commands() { return (window.dataLayer || []).map(args => Array.from(args)); }};
}

test('a first visit loads no Google code and starts with analytics disabled', () => {
  const v = visit();
  assert.equal(v.scripts.length, 0);
  assert.equal(v.window.dataLayer, undefined);
  assert.equal(v.window['ga-disable-' + id], true);
  assert.equal(v.banner.hidden, false);
  assert.ok(v.cookies.every(value => value.includes('Max-Age=0')));
});

test('declining stores the choice without loading a tag', () => {
  const v = visit(); v.decline.click();
  const saved = JSON.parse(v.storage.get(key));
  assert.equal(saved.choice, 'denied');
  assert.ok(saved.expires > Date.now() + 179 * 86400000);
  assert.equal(v.scripts.length, 0);
  assert.equal(v.banner.hidden, true);
});

test('accepting loads only the supplied LH ID with advertising denied', () => {
  const v = visit(); v.accept.click();
  assert.equal(v.scripts.length, 1);
  assert.equal(v.scripts[0].src, 'https://www.googletagmanager.com/gtag/js?id=' + id);
  assert.equal(v.scripts[0].async, true);
  const commands = v.commands();
  assert.equal(commands[0][0], 'consent');
  assert.equal(commands[0][1], 'default');
  assert.equal(commands[0][2].analytics_storage, 'denied');
  assert.equal(commands[1][1], 'update');
  assert.equal(commands[1][2].analytics_storage, 'granted');
  for (const command of commands.slice(0, 2)) {
    for (const field of ['ad_storage', 'ad_user_data', 'ad_personalization']) assert.equal(command[2][field], 'denied');
  }
  const config = commands.find(command => command[0] === 'config');
  assert.equal(config[1], id);
  assert.equal(config[2].allow_google_signals, false);
  assert.equal(config[2].allow_ad_personalization_signals, false);
  assert.equal(config[2].cookie_expires, 90 * 86400);
  assert.equal(v.window['ga-disable-' + id], false);
});

test('repeated acceptance never duplicates the tag or config call', () => {
  const v = visit(); v.accept.click(); v.settings.click(); v.accept.click();
  assert.equal(v.scripts.length, 1);
  assert.equal(v.commands().filter(command => command[0] === 'config').length, 1);
});

test('saved consent loads the tag on both public hostnames', () => {
  for (const hostname of ['leightonhepworth.com', 'www.leightonhepworth.com']) {
    const v = visit({hostname, saved: preference('granted')});
    assert.equal(v.scripts.length, 1);
    assert.equal(v.banner.hidden, true);
  }
});

test('saved refusal remains off without showing the banner again', () => {
  const v = visit({saved: preference('denied')});
  assert.equal(v.scripts.length, 0);
  assert.equal(v.banner.hidden, true);
  assert.equal(v.window['ga-disable-' + id], true);
});

test('expired, malformed and unexpected choices do not permit analytics', () => {
  const invalid = ['broken JSON', 'null', '{}', preference('other'), JSON.stringify({choice: 'granted', expires: Date.now() - 1})];
  for (const saved of invalid) {
    const v = visit({saved});
    assert.equal(v.scripts.length, 0);
    assert.equal(v.banner.hidden, false);
    assert.equal(v.window['ga-disable-' + id], true);
  }
});

test('preview, hosting aliases and insecure URLs never load analytics', () => {
  for (const options of [{hostname: 'terminal.local', protocol: 'http:'},
    {hostname: 'leighton-hepworth.taccountant.chatgpt.site'}, {protocol: 'http:'}]) {
    const v = visit(options); v.accept.click();
    assert.equal(v.scripts.length, 0);
  }
});

test('blocked browser storage defaults off but can honour a choice for this visit', () => {
  const v = visit({blocked: true});
  assert.equal(v.scripts.length, 0);
  v.accept.click();
  assert.equal(v.scripts.length, 1);
  assert.equal(visit({blocked: true}).scripts.length, 0);
});

test('withdrawal disables the tag, expires its cookies and reloads without further config', () => {
  const v = visit(); v.accept.click(); v.settings.click(); v.decline.click();
  assert.equal(v.window['ga-disable-' + id], true);
  assert.equal(JSON.parse(v.storage.get(key)).choice, 'denied');
  assert.equal(v.reloads, 1);
  assert.equal(v.scripts.length, 1);
  assert.ok(v.cookies.some(value => value.startsWith('_ga_80ZJ15H2XX=; Max-Age=0')));
  assert.ok(v.cookies.some(value => value.includes('domain=.leightonhepworth.com')));
  assert.equal(visit({saved: v.storage.get(key)}).scripts.length, 0);
});

test('a refusal in another tab immediately disables this tab', () => {
  const v = visit({saved: preference('granted')});
  v.storage.set(key, preference('denied')); v.storageEvent();
  assert.equal(v.window['ga-disable-' + id], true);
  assert.equal(v.reloads, 1);
});

test('clearing preferences in another tab restores the default-off choice', () => {
  const v = visit({saved: preference('granted')});
  v.storage.clear(); v.storageEvent(null);
  assert.equal(v.window['ga-disable-' + id], true);
  assert.equal(v.banner.hidden, false);
  assert.equal(v.reloads, 1);
});

test('a grant in another tab loads analytics, unrelated preferences have no effect', () => {
  const v = visit(); v.storage.set(key, preference('granted'));
  v.storageEvent('another-project-setting'); assert.equal(v.scripts.length, 0);
  v.storageEvent(); assert.equal(v.scripts.length, 1);
});

test('Cookie settings reopens the choice and returns keyboard focus when saved', () => {
  const v = visit({saved: preference('denied')}); v.settings.click();
  assert.equal(v.banner.hidden, false);
  assert.equal(v.title.focused, true);
  v.decline.click();
  assert.equal(v.banner.hidden, true);
  assert.equal(v.settings.focused, true);
});

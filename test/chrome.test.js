'use strict';
// Node's own test runner, no dependencies - this package has none and is not
// going to acquire one to test three hundred lines of string building.
//
//   npm test
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const brand = require('..');

const ASSETS = { base: '/brand', version: '7' };

test('escapes every interpolated value', () => {
  const html = brand.topBar({
    product: '<script>alert(1)</script>',
    context: 'A & B',
    account: { name: '"><img src=x>', email: 'a@b.test', menu: [] },
    assets: ASSETS,
  });
  assert.ok(!html.includes('<script>alert'), 'product name was not escaped');
  assert.ok(!html.includes('"><img src=x>'), 'account name was not escaped');
  assert.ok(html.includes('A &amp; B'));
});

test('asset addresses come from the consumer, with no hard-coded path', () => {
  assert.equal(brand.assetUrl({ base: '/static/x/', version: '9' }, 'brand.css'),
    '/static/x/brand.css?v=9');
  // A consumer with its own cache-busting scheme passes no version.
  assert.equal(brand.assetUrl({ base: 'https://cdn.example/b' }, 'gate-dark.png'),
    'https://cdn.example/b/gate-dark.png');
  // And the default has to be something, so a consumer that passes nothing at
  // all still renders rather than emitting "undefined/brand.css".
  assert.equal(brand.assetUrl(undefined, 'brand.css'), '/brand/brand.css');
});

test('initials: two letters from a name, one from an address', () => {
  assert.equal(brand.initials({ name: 'Ada Lovelace' }), 'AL');
  assert.equal(brand.initials({ name: 'Prince' }), 'PR');
  assert.equal(brand.initials({ name: '  Grace  Brewster  Hopper ' }), 'GH');
  assert.equal(brand.initials({ email: 'zoe@example.test' }), 'Z');
  assert.equal(brand.initials({}), '?');
  assert.equal(brand.initials(undefined), '?');
});

test('the account menu carries no inline script and no event handler', () => {
  // GateIron's CSP sets script-src-attr 'none' and forbids inline <script>.
  // A component that needs either cannot ship on that site at all.
  const html = brand.page({
    title: 'x',
    body: '<p>y</p>',
    assets: ASSETS,
    account: {
      name: 'Ada Lovelace', email: 'ada@example.test', role: 'admin',
      menu: [{ href: '/settings', label: 'Settings' },
             { label: 'Sign out', form: { action: '/logout' } }],
    },
  });
  assert.ok(!/<script/i.test(html), 'a <script> block appeared in the chrome');
  assert.ok(!/\son[a-z]+\s*=/i.test(html), 'an inline event handler appeared in the chrome');
  assert.ok(html.includes('<details class="account"'), 'the menu is not a details element');
  // Sign-out is a POST form, not a link: a link that changes state is a link a
  // prefetcher will follow.
  assert.ok(html.includes('<form method="post" action="/logout">'));
});

test('signed out renders a sign-in button; no account at all leaves a slot', () => {
  const out = brand.topBar({ signIn: { href: '/login', label: 'Staff sign in' }, assets: ASSETS });
  assert.ok(out.includes('href="/login"') && out.includes('Staff sign in'));

  // GateIron fills this from /api/me after load.
  const slot = brand.topBar({ assets: ASSETS });
  assert.ok(slot.includes('<span class="account-slot"></span>'));

  const none = brand.topBar({ assets: ASSETS, accountSlot: false });
  assert.ok(!none.includes('account-slot'));
});

test('nav marks the current item with aria-current, not only a class', () => {
  const html = brand.topBar({
    assets: ASSETS,
    nav: [{ href: '/a', label: 'A', current: true }, { href: '/b', label: 'B' }],
  });
  assert.ok(html.includes('href="/a" aria-current="page"'));
  assert.ok(html.includes('href="/b">B</a>'));
});

test('compact density sets the body class GateIron already uses', () => {
  assert.ok(brand.page({ title: 't', density: 'compact', assets: ASSETS })
    .includes('<body class="gi-compact">'));
});

test('the classroom footer is a variant, and its links are passed in', () => {
  const f = brand.siteFooter({ variant: 'classroom', links: [{ href: '/privacy', label: 'Privacy' }] });
  assert.ok(f.includes('is-classroom'));
  assert.ok(f.includes('href="/privacy"'));
  // Nothing commercial may be invented by this package.
  assert.ok(!/etsy|shop/i.test(f));
});

test('the skip link comes before the bar in the DOM', () => {
  const html = brand.page({ title: 't', body: '', assets: ASSETS });
  assert.ok(html.indexOf('class="skip-link"') < html.indexOf('<header class="topbar"'));
  assert.ok(html.includes('<main id="main" tabindex="-1">'));
});

test('an ESM consumer can import the named exports', () => {
  // NotUserError is type: module. Node's named-export detection reads a static
  // module.exports object; a dynamic one would silently leave an ESM consumer
  // with only a default import, which is why this is a test and not a comment.
  const script = "import { topBar, initials } from " + JSON.stringify(path.resolve(__dirname, '..', 'chrome.js'))
    + "; console.log(typeof topBar, initials({ name: 'Ada Lovelace' }));";
  const out = execFileSync(process.execPath, ['--input-type=module', '-e', script], { encoding: 'utf8' });
  assert.equal(out.trim(), 'function AL');
});

test('every asset the chrome asks for is actually in the package', () => {
  const html = brand.page({ title: 't', body: '', assets: { base: '/brand' } });
  const names = [...html.matchAll(/\/brand\/([\w./-]+)/g)].map((m) => m[1]);
  assert.ok(names.length >= 3, 'expected the stylesheet and both gate marks');
  for (const name of new Set(names)) {
    // One static mount serves the whole package, so everything the chrome
    // asks for must sit under assets/ - including the stylesheet, whose
    // @font-face rules resolve relative to itself.
    assert.ok(fs.existsSync(path.resolve(__dirname, '..', 'assets', name)),
      'missing from the package: ' + name);
  }
});

test('the fonts carry their licences', () => {
  const dir = path.resolve(__dirname, '..', 'assets', 'fonts');
  for (const f of ['fraunces-latin.woff2', 'hanken-grotesk-latin.woff2',
                   'OFL-fraunces.txt', 'OFL-hanken-grotesk.txt']) {
    assert.ok(fs.existsSync(path.join(dir, f)), 'missing: ' + f);
  }
});

test('the stylesheet fetches nothing from a third party', () => {
  const css = fs.readFileSync(path.resolve(__dirname, '..', 'assets', 'brand.css'), 'utf8');
  const urls = [...css.matchAll(/url\(\s*['"]?([^'")]+)/g)].map((m) => m[1]);
  for (const u of urls) {
    assert.ok(!/^https?:|^\/\//.test(u), 'the stylesheet reaches off-site: ' + u);
  }
});

test('the bar GateIron needs can be built from this package', () => {
  // Not a migration - a standing check that the API still fits the consumer
  // that has not adopted it yet. GateIron's bar is: compact density, its own
  // button row before the account chip, and an account slot its client fills
  // from /api/me after load.
  const html = brand.topBar({
    home: '/',
    product: 'GateIron, LLC',
    context: 'Hood River · Oregon',
    density: 'compact',
    assets: { base: '/brand', version: '20260920-a' },
    actions: '<a class="btn btn-line" href="/games/">Games</a>'
           + '<a class="btn btn-primary" href="https://www.etsy.com/shop/GateIronLLC"'
           + ' target="_blank" rel="noopener">Shop</a>',
  });
  assert.ok(html.includes('Hood River'));
  assert.ok(html.includes('href="/games/"'), 'the consumer\'s own action row was dropped');
  assert.ok(html.indexOf('btn-primary') < html.indexOf('account-slot'),
    'actions must come before the account chip, as GateIron orders them');
  assert.ok(html.includes('?v=20260920-a'), 'the consumer\'s cache marker was not used');
  assert.ok(!/<script|\son[a-z]+\s*=/i.test(html));
});

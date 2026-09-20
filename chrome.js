'use strict';
// The GateIron chrome: the bar across the top, the footer, and the document
// around them, as strings.
//
// CommonJS, and plain data in, HTML out. Both of those are requirements rather
// than taste - see README.md - and the second is the one that is easy to break:
// NOTHING HERE MAY TOUCH A REQUEST OBJECT. An Express `req` would tie the
// package to one framework and one Node version's idea of a request, and
// GateIron builds its chrome by string substitution at serve time with no
// request in scope at all.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ESC[c]);

// Every asset address is built through here so a consumer can put the files
// wherever it serves static content and stamp its own cache marker on them.
// GateIron's versionAssets appends ?v=<build>; NotUserError uses the brand's
// own version. Neither is hard-coded.
function assetUrl(assets, name) {
  const base = String((assets && assets.base) || '/brand').replace(/\/+$/, '');
  const v = assets && assets.version;
  return base + '/' + name + (v ? '?v=' + encodeURIComponent(v) : '');
}

/**
 * Two letters from a name, one from an address. Never empty, never undefined.
 * Exported because a consumer that renders its own avatar still wants the same
 * initials this package would have drawn.
 */
function initials(person) {
  const name = ((person && person.name) || '').trim();
  if (name) {
    const parts = name.split(/\s+/);
    const letters = parts.length > 1
      ? parts[0][0] + parts[parts.length - 1][0]
      : parts[0].slice(0, 2);
    return letters.toUpperCase();
  }
  return (((person && person.email) || '?')).slice(0, 1).toUpperCase();
}

/**
 * The gate. Two files rather than one: the mark is dark ink and disappears on
 * a dark ground, so the browser picks before it fetches.
 * `alt` is empty because the wordmark beside it already names the product.
 */
function gateMark(assets) {
  return '<picture>'
    + '<source srcset="' + esc(assetUrl(assets, 'gate-light.png')) + '" media="(prefers-color-scheme: dark)">'
    + '<img src="' + esc(assetUrl(assets, 'gate-dark.png')) + '" alt="" width="148" height="96">'
    + '</picture>';
}

function navHtml(nav) {
  if (!nav || !nav.length) return '';
  const items = nav.map((item) => {
    // aria-current, not a class: the marker is announced as well as seen.
    const current = item.current ? ' aria-current="page"' : '';
    const rel = item.external ? ' target="_blank" rel="noopener"' : '';
    return '<a href="' + esc(item.href) + '"' + current + rel + '>' + esc(item.label) + '</a>';
  }).join('');
  return '<nav class="topnav" aria-label="' + esc((nav.label) || 'Sections') + '">' + items + '</nav>';
}

function avatarHtml(account) {
  const cls = 'avatar' + (account.accent ? ' is-accent' : '');
  // An image avatar is a third-party request on every signed-in page unless the
  // consumer proxies it. Initials are the default for that reason; a consumer
  // that wants the picture passes it and accepts the request.
  if (account.avatarSrc) {
    return '<span class="' + cls + ' has-img"><img src="' + esc(account.avatarSrc)
      + '" alt="" width="64" height="64" referrerpolicy="no-referrer"></span>';
  }
  return '<span class="' + cls + '" aria-hidden="true">' + esc(initials(account)) + '</span>';
}

/**
 * The account chip. A <details> element, so the menu opens with no JavaScript:
 * a requirement, not a convenience - GateIron's content security policy
 * forbids inline script and inline event handlers, and a class page must work
 * for a child whose school blocks things.
 *
 * Pass `account: null` with `signIn` for the signed-out state, or neither to
 * leave the slot empty (GateIron fills it client-side from /api/me).
 */
function accountHtml(opts) {
  const account = opts.account;
  if (!account) {
    if (opts.signIn) {
      return '<a class="btn btn-secondary btn-small" href="' + esc(opts.signIn.href) + '">'
        + esc(opts.signIn.label || 'Sign in') + '</a>';
    }
    return opts.accountSlot === false ? '' : '<span class="account-slot"></span>';
  }
  const menu = (account.menu || []).map((item) => {
    if (item.form) {
      return '<form method="' + esc(item.form.method || 'post') + '" action="' + esc(item.form.action)
        + '">' + (item.form.hidden || '') + '<button type="submit">' + esc(item.label) + '</button></form>';
    }
    return '<a href="' + esc(item.href) + '">' + esc(item.label) + '</a>';
  }).join('');
  const who = account.name || account.email;
  const sub = account.role ? esc(account.role) : '';
  return '<details class="account">'
    + '<summary aria-label="' + esc(account.menuLabel || 'Account menu') + '">'
    + '<span class="who"><b>' + esc(who) + '</b>' + sub + '</span>'
    + avatarHtml(account)
    + '</summary>'
    + '<div class="account-menu">'
    + (account.email ? '<div class="meta">' + esc(account.email) + '</div>' : '')
    + menu
    + '</div>'
    + '</details>';
}

/**
 * The bar. `home` is where the mark and wordmark link, `product` is the name
 * shown, `context` the smaller line under it (a district, a class, a site).
 */
function topBar(opts) {
  const o = opts || {};
  const context = o.context ? '<small>' + esc(o.context) + '</small>' : '';
  return '<header class="topbar">'
    + '<div class="topbar-inner">'
    + '<a class="brand" href="' + esc(o.home || '/') + '">'
    + gateMark(o.assets)
    + '<span class="wordmark">' + esc(o.product || 'GateIron') + context + '</span>'
    + '</a>'
    + navHtml(o.nav)
    + '<span class="topbar-spacer"></span>'
    + (o.actions || '')
    + accountHtml(o)
    + '</div>'
    + '</header>';
}

/**
 * The footer. `variant: 'classroom'` is the reduced one for pages a child may
 * be looking at: no shop, no outbound commercial links, nothing that reads as
 * an advertisement. Which links belong in each variant is the consumer's to
 * pass; the variant only decides the class and the default byline.
 */
function siteFooter(opts) {
  const o = opts || {};
  const classroom = o.variant === 'classroom';
  const links = (o.links || []).map((l) => {
    const rel = l.external ? ' target="_blank" rel="noopener"' : '';
    return '<a href="' + esc(l.href) + '"' + rel + '>' + esc(l.label) + '</a>';
  }).join('');
  const byline = o.byline === null ? ''
    : '<div class="by"><span>' + esc(o.byline || 'A GateIron product') + '</span>'
      + gateMark(o.assets) + '</div>';
  const fine = o.finePrint ? '<div class="fine-print">' + esc(o.finePrint) + '</div>' : '';
  return '<footer class="site-footer' + (classroom ? ' is-classroom' : '') + '">'
    + '<div class="inner"><div class="footer-links">' + links + '</div>' + byline + '</div>'
    + fine
    + '</footer>';
}

/**
 * A whole document. A consumer that builds its own HTML shell (GateIron does,
 * by substitution into static pages) should use topBar and siteFooter alone
 * and ignore this.
 */
function page(opts) {
  const o = opts || {};
  const bodyClass = o.density === 'compact' ? ' class="gi-compact"' : (o.bodyClass ? ' class="' + esc(o.bodyClass) + '"' : '');
  return '<!doctype html>\n<html lang="' + esc(o.lang || 'en') + '">\n<head>\n'
    + '<meta charset="utf-8">\n'
    + '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
    + '<title>' + esc(o.title) + '</title>\n'
    + '<link rel="stylesheet" href="' + esc(assetUrl(o.assets, 'brand.css')) + '">\n'
    + (o.head || '')
    + '</head>\n<body' + bodyClass + '>\n'
    + '<a class="skip-link" href="#main">Skip to content</a>\n'
    + topBar(o)
    + '\n<main id="main" tabindex="-1">\n' + (o.body || '') + '\n</main>\n'
    + siteFooter(o.footer || { assets: o.assets })
    + '\n</body>\n</html>';
}

// Every value here is a bare identifier, and that is load-bearing: Node
// detects a CommonJS module's named exports by statically reading this object,
// so a property whose value is a call expression (VERSION used to be
// `require('./package.json').version` here) turns the whole thing into a
// default-only import for every ESM consumer. There is a test for it.
const VERSION = require('./package.json').version;

module.exports = {
  VERSION,
  esc,
  assetUrl,
  initials,
  gateMark,
  topBar,
  siteFooter,
  page,
};

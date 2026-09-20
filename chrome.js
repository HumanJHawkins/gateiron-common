'use strict';
// The bar, the footer, and the document around them, as strings.
//
// Nothing here may touch a request object. GateIron substitutes its chrome into
// static HTML at serve time, with no request in scope.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ESC[c]);

// Consumers serve the files from their own path and stamp their own cache
// marker, so no address is hard-coded.
function assetUrl(assets, name) {
  const base = String((assets && assets.base) || '/brand').replace(/\/+$/, '');
  const v = assets && assets.version;
  return base + '/' + name + (v ? '?v=' + encodeURIComponent(v) : '');
}

/** Two letters from a name, one from an address. Never empty. */
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
 * The gate. Two files: the mark is dark ink and disappears on a dark ground.
 * `alt` is empty - the wordmark beside it already names the product.
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
    const current = item.current ? ' aria-current="page"' : '';
    const rel = item.external ? ' target="_blank" rel="noopener"' : '';
    return '<a href="' + esc(item.href) + '"' + current + rel + '>' + esc(item.label) + '</a>';
  }).join('');
  return '<nav class="topnav" aria-label="' + esc((nav.label) || 'Sections') + '">' + items + '</nav>';
}

function avatarHtml(account) {
  const cls = 'avatar' + (account.accent ? ' is-accent' : '');
  // An image is a third-party request on every signed-in page. Initials default.
  if (account.avatarSrc) {
    return '<span class="' + cls + ' has-img"><img src="' + esc(account.avatarSrc)
      + '" alt="" width="64" height="64" referrerpolicy="no-referrer"></span>';
  }
  return '<span class="' + cls + '" aria-hidden="true">' + esc(initials(account)) + '</span>';
}

/**
 * The account chip. <details> rather than a click handler: GateIron's CSP
 * forbids inline script and inline event handlers.
 *
 * Pass `signIn` without `account` for the signed-out state, or neither to leave
 * an empty slot for a client script to fill.
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

/** `context` is the smaller line under the product name - a district, a class. */
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
 * `variant: 'classroom'` is the quieter footer for pages a child may be
 * reading. It sets the class and the default byline; the links are passed in.
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

/** A whole document. Sites with their own shell use topBar and siteFooter. */
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

// Keep every value below a bare identifier. Node reads this object statically
// to find a CommonJS module's named exports, and a call expression here makes
// the package default-only for ESM consumers.
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

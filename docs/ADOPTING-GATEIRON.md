# Hand-off: bringing GateIron.com onto gateiron-common

For the GateIron.com thread. Written 2026-09-20 by the session that extracted
this package out of NotUserError.

GateIron is where all of this came from — the palette, the two faces, the gate
mark, the pill buttons, the account menu. The package exists because
NotUserError wanted the same look and ended up with a second copy of the fonts
and the logo. Bringing GateIron onto it closes that, and makes the site that
defined the style a consumer of it rather than the place it happens to live.

**Nothing here is urgent and nothing here is decided.** NotUserError is wearing
the package now; this is step 3 of Jeff's rollout, after NotUnderConstruction.

## What was already done for you

The API was shaped from GateIron's constraints before any other site adopted
it, because adopting the strictest consumer last is how a package earns a major
version nobody wanted. Seven of them are in the README as numbered requirements
with their reasons. The ones that cost design effort:

- **Plain data in, HTML out — never an Express `req`.** `pageChrome.js`
  substitutes into static HTML at serve time with no request in scope, so an
  API taking a request would have been unusable here. This is the constraint
  that shaped everything else.
- **CommonJS, with a statically analysable `module.exports`.** `require()`
  works; so does an ESM consumer's named import. There is a test.
- **No inline `<script>`, no inline event handlers, anywhere.** The account
  menu is a `<details>` element for this reason and not for elegance —
  `script-src-attr 'none'` would have refused a click handler. A test asserts
  the whole rendered document contains neither.
- **Two densities.** `body.gi-compact` tightens the bar exactly as
  `base.css` does now — 28px mark, 30px avatar — so a game page keeps its
  board height.
- **Asset addresses are yours.** Nothing is hard-coded: `assetUrl({ base,
  version }, name)` builds every one. Pass the build marker `versionAssets`
  already produces and the addresses come out in the shape the CDN sees today.
- **The account slot can stay client-filled.** Pass no `account` and no
  `signIn` and the bar emits `<span class="account-slot"></span>` for
  `/js/account.js` to fill from `/api/me`, exactly as it does now.

There is a standing test in this repository — "the bar GateIron needs can be
built from this package" — that renders a compact bar with your action row,
your cache marker and an empty account slot. If a change here ever breaks what
GateIron needs, that test fails in this repository rather than in yours.

## What is genuinely different, and will need decisions

1. **The footer.** GateIron's is richer than the package's: a brand block with
   the light mark and "Hood River, Oregon", a link column including Etsy and
   Printables, and a two-line fine print with the year. The package's
   `siteFooter` takes `links`, `byline`, `finePrint` and a `classroom` variant.
   Either pass GateIron's content into it, or extend the component — **which
   one is a judgement about how much of that shape other sites will want.**
   Do not quietly fork it.
2. **The `ACTIONS` vocabulary.** `pageChrome.js` refuses an unknown nav action
   by name, which is what stops six navs drifting into six dialects. The
   package does not do that, deliberately — it takes rendered HTML in
   `actions`. Keep the vocabulary and the throw where they are, in GateIron,
   and hand the joined string to the package.
3. **Comment stripping.** `pageChrome` strips HTML comments out of the partials
   on the way to the browser, worth 7 KB on a no-cache page. The package emits
   no HTML comments at all, so that step becomes unnecessary for the chrome —
   but check before deleting it, because your own page files may rely on it.
4. **The marketing pages' own look.** `gateiron.css` is 22 KB of site-specific
   styling on top of `base.css`. Only `base.css` is replaced by this package.
   Expect to reconcile tokens: `base.css` and the package agree today because
   the package was copied from it, but `--cover-img` and the other page-level
   variables stay yours.
5. **A dark theme arrives.** GateIron has only ever had paper. The package's
   stylesheet carries a `prefers-color-scheme: dark` block, so adopting it will
   make the site dark for a visitor whose system is dark — a visible change to
   a marketing site, and **Jeff's call whether that is wanted on gateiron.com
   or should be opted out of there**.

## The mechanics

```bash
npm install --allow-git=root github:HumanJHawkins/gateiron-common#v0.1.0
```

**npm 12 refuses git dependencies by default** (`EALLOWGIT`) — this package is
installed from a GitHub tag, not the registry. Put `allow-git=root` in the
project's `.npmrc` so the setting travels with the repository rather than
living in someone's shell history; `root` rather than `all` allows only a
dependency this `package.json` names, never one a transitive dependency reaches
for. If the site is ever built in a container, that image needs `git`
installed and the `.npmrc` copied in before `npm ci`.

Serve the files out of the installed package rather than copying them into
`webroot`:

```js
const path = require('path');
const ASSETS = path.join(path.dirname(require.resolve('gateiron-common/package.json')), 'assets');
app.use('/brand', express.static(ASSETS, { maxAge: '365d', immutable: true }));
```

Everything the chrome asks for lives under `assets/`, including the stylesheet,
whose `@font-face` rules resolve relative to itself. One mount.

Then, in `pageChrome.js`, call `topBar()` and `siteFooter()` where the partials
are read now. Keep your shell: `page()` exists for sites that do not have one,
and GateIron does.

## When it is done

`webroot/image/gateIronLogo*.png`, `webroot/fonts/*.woff2` and the chrome half
of `webroot/css/base.css` stop being the source and become the package's. The
note at the bottom of `webroot/image/README.md` says so and should be rewritten
to point at the package once it is true.

## If something here is wrong

The package is a repository, not a decree. Open an issue against
<https://github.com/HumanJHawkins/gateiron-common> rather than working around
it in GateIron — a workaround here is the second copy this whole thing exists
to end.

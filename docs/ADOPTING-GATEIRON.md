# Bringing GateIron.com onto gateiron-common

For the GateIron.com thread. Step 3 of the rollout, after NotUserError (done)
and NotUnderConstruction. Nothing here is urgent or decided.

GateIron is where the palette, the faces, the gate mark, the pill buttons and
the account menu came from. Adopting the package makes the site that defined
the style a consumer of it.

## Already handled

The API was shaped from GateIron's constraints, so most of this should be
mechanical:

- **Plain data in, HTML out — never an Express `req`.** `pageChrome.js`
  substitutes into static HTML with no request in scope.
- **CommonJS**, with named imports available to ESM consumers too.
- **No inline `<script>`, no inline event handlers, anywhere.** The account
  menu is a `<details>` element; `script-src-attr 'none'` would refuse a click
  handler.
- **`body.gi-compact`** tightens the bar exactly as `base.css` does — 28px
  mark, 30px avatar.
- **`assetUrl({ base, version }, name)`** builds every address. Pass the marker
  `versionAssets` already produces.
- **The account slot can stay client-filled.** Pass no `account` and no
  `signIn` and the bar emits `<span class="account-slot"></span>` for
  `/js/account.js`.

A test in this repository renders a compact bar with GateIron's action row,
cache marker and empty account slot. A change here that breaks what GateIron
needs fails here.

## Needs decisions

1. **The footer.** GateIron's is richer than the package's: a brand block with
   the light mark and "Hood River, Oregon", a link column including Etsy and
   Printables, two lines of fine print with the year. `siteFooter` takes
   `links`, `byline`, `finePrint` and a `classroom` variant. Either pass
   GateIron's content in, or extend the component — a judgement about how much
   of that shape other sites will want. Do not fork it.
2. **The `ACTIONS` vocabulary.** `pageChrome.js` throws on an unknown nav
   action by name. The package takes rendered HTML in `actions` instead. Keep
   the vocabulary and the throw in GateIron; hand the joined string over.
3. **Comment stripping.** `pageChrome` strips HTML comments from the partials,
   worth 7 KB on a no-cache page. The package emits none, so the step becomes
   unnecessary for the chrome. Check your own page files before deleting it.
4. **`gateiron.css`.** 22 KB of site-specific styling stays yours; only
   `base.css` is replaced. Expect to reconcile tokens — they agree today
   because the package was copied from `base.css`.
5. **A dark theme arrives.** The stylesheet carries a
   `prefers-color-scheme: dark` block, so the site turns dark for a visitor
   whose system is. Jeff's call whether gateiron.com wants that.

## Mechanics

```bash
npm install --allow-git=all github:HumanJHawkins/gateiron-common#v0.1.1
```

npm 12 blocks git dependencies by default (`EALLOWGIT`). Put `allow-git=all`
in the project's `.npmrc`; the narrower `root` refuses an already-locked git
dependency on reinstall (npm/cli#9189). A container build needs `git` installed
and `.npmrc` copied before `npm ci`.

Serve the files from the installed package rather than copying them into
`webroot`:

```js
const path = require('path');
const ASSETS = path.join(path.dirname(require.resolve('gateiron-common/package.json')), 'assets');
app.use('/brand', express.static(ASSETS, { maxAge: '365d', immutable: true }));
```

Then call `topBar()` and `siteFooter()` in `pageChrome.js` where the partials
are read now. Keep your shell — `page()` is for sites without one.

## When it is done

`webroot/image/gateIronLogo*.png`, `webroot/fonts/*.woff2` and the chrome half
of `webroot/css/base.css` stop being the source. Rewrite the note at the bottom
of `webroot/image/README.md` to say so.

Something wrong here? Open an issue against
<https://github.com/HumanJHawkins/gateiron-common>. A workaround in GateIron is
the second copy this package exists to end.

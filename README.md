# gateiron-brand

GateIron's house style, as one package: the palette, the two faces, the gate
mark, the top bar, the footer, and the components every GateIron site draws —
buttons, forms, tables, badges, notices, the account menu.

One source of truth. A site that wears this does not keep its own copy of a
colour, a font file or a header.

```bash
npm install github:HumanJHawkins/gateiron-brand#v0.1.0
```

Pinned to a tag, always. A brand that changes when you deploy is a brand you
can reason about; one that changes on its own is a support call from a district
that saw two different sites on Tuesday.

---

## Why a package rather than a service

Considered and rejected: a "managed" copy synced from gateiron.com to each
satellite. It buys the ability to push a change to sites you do not deploy,
which is not a problem here — Jeff deploys all of them — and it costs a daemon
to monitor, a window where two sites disagree, and a failure mode where the
brand is stale with nothing saying so. A pinned dependency has none of those
and updates with one command.

Public repository, because the Lightsail box has no GitHub credentials and a
brand has no secrets. See LICENSE for what that does and does not grant.

---

## Requirements this has to meet

Written down because three of them are not obvious, and all three came from a
consumer that has not adopted the package yet. Shaping an API on the two
easiest consumers and discovering GateIron's constraints at the end is exactly
how this earns a v2 nobody wanted.

### From GateIron.com — the strictest consumer

1. **No build step.** GateIron has no bundler by decision. The package must be
   consumable as plain files that Node can `require` and a browser can load.
   No compile, no transpile, no CSS preprocessor.
2. **CommonJS.** GateIron is `require()`; NotUserError is `type: module`.
   Authored as CJS with a static `module.exports` object, so Node's ESM named
   export detection lets an ESM consumer write
   `import { topBar } from 'gateiron-brand'`. There is a test for this.
3. **No inline script, no inline event handlers.** GateIron's content security
   policy sets `script-src-attr 'none'` and forbids inline `<script>` blocks.
   Every interactive component here must work without either — which is why the
   account menu is a `<details>` element and not a click handler.
4. **Two densities.** Game pages carry `body.gi-compact` and the bar tightens
   so the board keeps its height. `page({ density: 'compact' })`, or set the
   class yourself if you build your own shell.
5. **Asset addresses are the consumer's.** GateIron stamps `?v=<build>` on
   every asset through its own `versionAssets`, and its images pass through
   Hostinger's CDN. Nothing here hard-codes a path: every address is built by
   `assetUrl({ base, version }, name)`.
6. **Serve-time string substitution.** GateIron injects chrome into static HTML
   at serve time with no request object in scope. So the functions take **plain
   data** — never an Express `req`. This is the single most important
   constraint in this document and the easiest one to violate by accident.
7. **The account slot may be filled by the client.** GateIron's
   `/js/account.js` fills the bar from `/api/me` after load; NotUserError
   renders it on the server. Passing no `account` and no `signIn` emits an
   empty `<span class="account-slot">` for the client to fill.

### From NotUserError

8. **Initials, not a photograph, by default.** Google hands back a picture URL
   on `lh3.googleusercontent.com`; using it puts a third-party request on every
   signed-in page. A consumer that wants it passes `avatarSrc` and accepts the
   request.
9. **A context line in the bar.** The district name sits under the product
   name. Generalised as `context`.
10. **Light and dark.** GateIron has only ever had paper. The dark theme lives
    here now, in the same family — warm charcoals so clay and pine keep their
    temperature.

### From NotUnderConstruction

11. **A classroom footer.** Pages a child may be looking at get a reduced
    footer: no shop, no outbound commercial links, nothing that reads as an
    advertisement. `siteFooter({ variant: 'classroom' })` sets the class and
    the default byline; **which links belong in each variant is Jeff's call**
    and is passed in, not decided here.
12. **Nothing school-specific.** No district, school or class name in this
    package, ever. Same rule NotUserError already holds itself to.

### Everywhere

13. **Accessible by construction.** A skip link ahead of the bar, `aria-current`
    on the active nav item, a visible focus ring, and colour never the only
    carrier of meaning — every badge states its value in words and the priority
    ramp is ordered by weight as well as hue.
14. **Self-hosted faces.** Fraunces and Hanken Grotesk travel in `assets/fonts`
    under the SIL Open Font License 1.1, with both licence texts beside them.
    No page may reach fonts.googleapis.com: a child's browser must not make a
    third-party request, and a district that allow-lists one domain should not
    need to allow-list Google's.
15. **Escape everything.** `esc()` is applied to every interpolated value in
    this package. A consumer passing a user's name into the bar must not have
    to think about it.

---

## API

Plain data in, HTML strings out.

```js
const { page, topBar, siteFooter, initials, assetUrl } = require('gateiron-brand');
```

### `topBar(opts)`

| option | meaning |
|---|---|
| `home` | where the mark and wordmark link |
| `product` | the name in the bar |
| `context` | the smaller line under it — a district, a class |
| `nav` | `[{ href, label, current?, external? }]` |
| `account` | `{ name, email, role?, avatarSrc?, accent?, menu: [...] }`, or omit |
| `signIn` | `{ href, label }` for the signed-out state |
| `actions` | raw HTML injected before the account chip, for a consumer's own buttons |
| `assets` | `{ base, version }` |

A menu entry is `{ href, label }` or `{ label, form: { action, method, hidden } }`
so a sign-out POST is a real form rather than a link that changes state.

### `siteFooter(opts)`

`links`, `byline` (`null` to omit), `finePrint`, `variant: 'classroom'`, `assets`.

### `page(opts)`

The whole document, for a consumer that does not build its own shell:
`title`, `body`, `head`, `lang`, `density`, `bodyClass`, `footer`, plus
everything `topBar` takes. GateIron should **not** use this — it has its own
shell and should call `topBar` and `siteFooter` into it.

### `initials(person)`, `assetUrl(assets, name)`, `esc(value)`

Exported because a consumer that renders part of the bar itself still wants the
same initials, the same addresses and the same escaping.

## Serving the assets

The package ships files; the consumer serves them. In Express:

```js
app.use('/brand', express.static(
  path.dirname(require.resolve('gateiron-brand/package.json')) + '/assets',
  { maxAge: '365d', immutable: true },
));
```

The stylesheet lives in `assets/` too, beside the fonts its `@font-face` rules
reference: **one mount serves the whole package.** Cache hard and put the
package version in `assets.version`, so a new version is a new address and
nothing stale survives.

---

## Versioning

Semver, and the tag is the contract. A change to a token's *value* is a minor;
removing a token, renaming a class, or changing what a function returns in a
way a consumer's CSS could depend on is a **major**.

`CHANGELOG.md` is the release note. A consumer upgrades deliberately:

```bash
npm install github:HumanJHawkins/gateiron-brand#v0.2.0
```

## What does not belong here

- Any product's vocabulary. NotUserError's ticket statuses map to badge tones
  in *its* `src/ui.js`, not here. This package knows about badges; it does not
  know what "Waiting" means.
- Anything school-specific, per requirement 12.
- Anything that needs a build step.

## Rollout

1. Build it. *(this repository)*
2. NotUserError and NotUnderConstruction adopt it, and the bugs come out there.
3. GateIron.com and NotHangman come home to it.

Step 3 is the one that decides whether the API was right, so the requirements
above were written from GateIron's constraints before step 2 started. **Render
one GateIron page from this package during step 2** — not a migration, just a
test that the API fits — rather than finding out at step 3.

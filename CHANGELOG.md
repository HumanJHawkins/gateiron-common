# Changelog

Semver. A token's value changing is a minor; removing a token, renaming a
class, or changing what a function returns in a way a consumer's CSS could
depend on is a major.

## 0.1.0 — unreleased

First extraction, from NotUserError, where this was written as
`public/brand/` and `src/brand/chrome.js`.

- Palette (paper, ink, clay, pine, ochre), light and dark.
- Fraunces and Hanken Grotesk, self-hosted, with their OFL texts.
- `topBar`, `siteFooter`, `page`, `initials`, `assetUrl`, `esc`.
- Components: buttons, forms, cards, notices, tables, status and priority
  badges, the account menu.
- Two densities: the default and `gi-compact`.
- Classroom footer variant.

Changed from the NotUserError original, all for reasons the README records as
requirements:

- **Functions take plain data, never an Express `req`.** Requirement 6.
- **CommonJS with a statically analysable `module.exports`.** Requirement 2 -
  and the first version of this failed its own test, because one export was
  `require('./package.json').version` and that call expression turned the
  package into a default-only import for every ESM consumer.
- `avatar.is-admin` is now `avatar.is-accent`: a role is the consumer's
  vocabulary, not the brand's.
- The stylesheet moved in beside the fonts it references, so one static mount
  serves the whole package.

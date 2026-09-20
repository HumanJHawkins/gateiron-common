# Changelog

Semver. Changing a token's value is a minor. Removing a token, renaming a
class, or changing what a function returns is a major.

## 0.1.1 — 2026-09-20

Editorial pass over every comment and document in the repository.

## 0.1.0 — 2026-09-20

First release, extracted from NotUserError.

- Palette (paper, ink, clay, pine, ochre), light and dark.
- Fraunces and Hanken Grotesk, self-hosted, with their OFL texts.
- `topBar`, `siteFooter`, `page`, `initials`, `assetUrl`, `esc`.
- Buttons, forms, cards, notices, tables, status and priority badges, the
  account menu.
- Two densities: the default and `gi-compact`.
- Classroom footer variant.

Changed from the NotUserError original:

- Functions take plain data, never an Express `req`.
- CommonJS, with a statically analysable `module.exports`.
- `avatar.is-admin` became `avatar.is-accent`. A role is the consumer's
  vocabulary.
- The stylesheet moved in beside the fonts it references, so one static mount
  serves the package.

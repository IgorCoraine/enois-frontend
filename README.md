# Visual check: design system migration

Screenshots for the review of the design system migration stack (#288 to #296). Not code: this
branch only holds images, so the PR comments can show them.

- Before: `qa` at `ae0a589`. After: `fe/09-cleanup` at `984b31b` with `@rede-enois/design-system@0.9.0-rc.3`.
- 16 routes (9 public, 7 signed in with a test account on a local backend), desktop 1440x900 and
  phone 390x844, light, dark, Synthwave dark and Frutiger Aero light themes.
- Headless Chrome through Playwright with animations off; `pixelmatch` at threshold 0.1 over the
  visible area. `report.json` holds all 128 comparisons; `img/` holds the light and Synthwave pairs.

## Round 2 (`round-2/`)

After `qa` moved to `45531d5` (GitHub profile import): before is `qa` at `45531d5`, after is
`fe/09-cleanup` at `457ebd5` with `@rede-enois/design-system@0.9.0-rc.4`. The profile is captured as
a full page, reached from the feed link: its loader does not run under dev SSR, so the first round's
profile captures showed "Pessoa não encontrada" on both sides.

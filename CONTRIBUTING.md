# Contributing

Use `pnpm` (not `npm`).

```sh
pnpm install
pnpm test        # vitest, with coverage
pnpm check       # types
pnpm lint        # oxlint + oxfmt
pnpm knip        # unused code
pnpm build
```

## Code style

- `snake_case` for functions, variables, parameters, options and result keys. `PascalCase` for types and classes.
- `const` wherever possible; `let` only for bindings that are reassigned.
- Functions are declarations (`function my_fn() {}`), never `const my_fn = () => {}`. Arrow functions are fine as inline callbacks.
- Only `src/adapter/css-parser.ts` talks to `@projectwallace/css-parser` for the engine; everything in `src/engine` goes through the adapter.

`pnpm lint` enforces most of this.

## Tests

Write unit tests: small, fast and next to the code they test.

- `src/foo/bar.ts` has its tests in `src/foo/bar.test.ts`. That goes for every public function.
- Test a collector on its own: `analyze(css, { result: colors() }).result`. Do not use the `analyze_all` or `analyze_compat` presets for it, they run every collector.
- Test a utility by calling it directly, with text (and with a parsed node when that matters). Prefer `test.each` tables over long fixtures.
- Use `plain()` and `series()` from `src/test-utils.ts` to compare count results with `toEqual()`.
- Integration tests are few and live with the presets: `src/presets/presets.test.ts` compares `analyze_compat` with the output of the 9.x analyzer that is stored in `src/presets/golden/*.json`. Do not edit those files by hand; they are the reference for backwards compatibility.
- Collectors must work on their own, with `merge()` and with `create_analyzer().add()`: `src/collectors/merge.test.ts` covers that for every collector, add yours there.

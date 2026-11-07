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
- The engine and collectors use `@projectwallace/css-parser` directly. Swapping the parser is not a goal; if it ever is, that is a refactor for then.

`pnpm lint` enforces most of this.

## Tests

Write unit tests: small, fast and next to the code they test.

- `src/foo/bar.ts` has its tests in `src/foo/bar.test.ts`. That goes for every public function.
- Test a collector on its own: `analyze(css, { result: colors() }).result`. Do not use the `analyze_all` preset for it, it runs every collector.
- Test a utility by calling it directly, with text (and with a parsed node when that matters). Prefer `test.each` tables over long fixtures.
- Use `plain()` and `series()` from `src/test-utils.ts` to compare count results with `toEqual()`.
- Integration tests are few and live with the presets: `src/presets/presets.test.ts`.

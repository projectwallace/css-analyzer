# Contributing

Use `pnpm` (not `npm`).

```sh
pnpm install
pnpm test        # vitest, with coverage
pnpm check       # types
pnpm lint        # oxlint + oxfmt
pnpm knip        # unused code
pnpm build       # build + publint
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

## Performance

- Avoid repeated CSS node property reads: each `.text`, `.name`, `.column` etc. makes the css-parser node read from its memory arena. Read it once and keep it in a `const`.
- Compare names case-insensitively with `str_equals('var', node.name)` from `@projectwallace/css-parser`, not with `node.name.toLowerCase() === 'var'`.
- Search case-insensitively with `str_index_of('var(', text) !== -1` from `@projectwallace/css-parser`, not with `text.toLowerCase().includes('var(')`. The search string must be lowercase.
- Iterate the children of a parser node with `node.for_each((child) => { ... })`, not `for...of`: the iterator is a generator, which is slow. Inside the callback `return` skips to the next child and `return false` stops.
- `str_equals` and `str_index_of` do not allocate a new string, `toLowerCase()` does. Use them wherever a value is only compared or searched, not transformed.

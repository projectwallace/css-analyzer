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

- `snake_case` for functions, variables, constants (`system_fonts`, not `SYSTEM_FONTS`), parameters, options and result keys. `PascalCase` for types and classes.
- `const` wherever possible; `let` only for bindings that are reassigned.
- Functions are declarations (`function my_fn() {}`), never `const my_fn = () => {}`. Arrow functions are fine as inline callbacks.
- Keep JSDoc to a minimum: a short `/** ... */` on what the package exports (it ends up in the `.d.ts` files, which are part of the package size), plain `//` comments for everything else and for the reasoning behind the code. The build drops JSDoc from the JavaScript.
- The engine and collectors use `@projectwallace/css-parser` directly. Swapping the parser is not a goal; if it ever is, that is a refactor for then.

`pnpm lint` enforces most of this.

## Where does code go?

```
src/
  index.ts       package root: analyze(), define_collector(), counters, summaries
  engine/        the walk, the shared context, counters. Knows nothing about collectors.
  collectors/    one file per collector, built on the engine
  presets/       ready-made collector sets (analyze_all, analyze_design_tokens)
  selectors/ values/ atrules/ properties/ stylesheet/
                 public utilities: plain functions on text or parsed nodes, one subpath export each
  utils/         shared helpers (string-utils, input, location); utils/collections is public
  integration/   tests that run several collectors together
  test/          test helpers
```

Imports only go downwards: `presets` -> `collectors` -> `engine` -> utility modules and `utils`.
Utility modules and `utils` never import `engine`, `collectors` or `presets`; the engine never imports `collectors` or `presets`; collectors never import `presets`. `pnpm lint` enforces this (`no-restricted-imports` in `.oxlintrc.json`).

Every public subpath of the package (`/collectors`, `/presets`, `/selectors`, `/values`, `/atrules`, `/properties`, `/stylesheet`, `/utils/collections`) is a folder with an `index.ts`, an entry in `exports` in `package.json` and an entry in `tsdown.config.ts` (`src/*/index.ts` covers all of them except `utils/collections`, which is listed on its own). A new public function needs a test next to it and a line in the readme; a new collector also needs an entry in `collectors/index.ts`, in `presets/all.ts` and in the collectors table of the readme.

## Tests

Write unit tests: small, fast and next to the code they test.

- `src/foo/bar.ts` has its tests in `src/foo/bar.test.ts`. That goes for every public function.
- Test a collector on its own: `analyze(css, { result: colors() }).result`. Do not use the `analyze_all` preset for it, it runs every collector.
- Test a utility by calling it directly, with text (and with a parsed node when that matters). Prefer `test.each` tables over long fixtures.
- Use `plain()` and `series()` from `src/test/test-utils.ts` to compare count results with `toEqual()`.
- Integration tests are few. Tests of the presets live in `src/presets/presets.test.ts`; tests that run several collectors together live in `src/integration/`.

## Performance

- Avoid repeated CSS node property reads: each `.text`, `.name`, `.column` etc. makes the css-parser node read from its memory arena. Read it once and keep it in a `const`.
- Compare names case-insensitively with `str_equals('var', node.name)` from `@projectwallace/css-parser`, not with `node.name.toLowerCase() === 'var'`.
- Search case-insensitively with `str_index_of('var(', text) !== -1` from `@projectwallace/css-parser`, not with `text.toLowerCase().includes('var(')`. The search string must be lowercase.
- Iterate the children of a parser node with `node.for_each((child) => { ... })`, not `for...of`: the iterator is a generator, which is slow. Inside the callback `return` skips to the next child and `return false` stops.
- `str_equals` and `str_index_of` do not allocate a new string, `toLowerCase()` does. Use them wherever a value is only compared or searched, not transformed.

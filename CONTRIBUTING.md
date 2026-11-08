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

- New code uses `snake_case` for functions, variables and parameters, and `PascalCase` for types and classes. Existing camelCase names in the public API stay as they are.
- `const` wherever possible; `let` only for bindings that are reassigned.
- Functions are declarations (`function my_fn() {}`), never `const my_fn = () => {}`. Arrow functions are fine as inline callbacks.

`pnpm lint` enforces most of this.

## Tests

- Tests live next to the code they test: `src/values/colors.ts` has its tests in `src/values/colors.test.ts`.
- Test a utility by calling it directly. Test a metric through `analyze(css)` and assert only the part of the result you care about.
- Prefer `test.each` tables over long fixtures.

## Performance

- Avoid repeated CSS node property reads: each `.text`, `.name`, `.column` etc. makes the css-parser node read from its memory arena. Read it once and keep it in a `const`.
- Compare names case-insensitively with `str_equals('var', node.name)` from `@projectwallace/css-parser`, not with `node.name.toLowerCase() === 'var'`.
- Search case-insensitively with `str_index_of('var(', text) !== -1` from `@projectwallace/css-parser`, not with `text.toLowerCase().includes('var(')`. The search string must be lowercase.
- `str_equals` and `str_index_of` do not allocate a new string, `toLowerCase()` does. Use them wherever a value is only compared or searched, not transformed.

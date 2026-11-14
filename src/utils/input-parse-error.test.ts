import { test, expect, vi } from 'vitest'

// The parser is forgiving: it does not throw for text. This mock makes it throw so the wrapping can be tested.
vi.mock('@projectwallace/css-parser/parse-selector', () => ({
	parse_selector_list: () => {
		throw new Error('boom')
	},
}))

test('as_selectors wraps a parser error in a TypeError that names the input', async () => {
	const { as_selectors } = await import('./input.ts')
	expect(() => as_selectors('a')).toThrow(
		new TypeError("Could not convert passed in source 'a' to SelectorList: boom"),
	)
})

test('as_selectors also handles a thrown value that is not an Error', async () => {
	vi.doMock('@projectwallace/css-parser/parse-selector', () => ({
		parse_selector_list: () => {
			// oxlint-disable-next-line no-throw-literal
			throw 'nope'
		},
	}))
	vi.resetModules()
	const { as_selectors } = await import('./input.ts')
	expect(() => as_selectors('a')).toThrow('to SelectorList: nope')
})

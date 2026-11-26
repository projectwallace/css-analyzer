import { test, expect } from 'vitest'
import { parse } from '@projectwallace/css-parser'
import { extract_mixins } from './mixins.ts'

function first_atrule(css: string) {
	return parse(css).first_child!
}

test.each([
	['@mixin --a(--x) { color: red }', 'definition', '--a'],
	['@mixin --a { color: red }', 'definition', '--a'],
	['@apply --a(1px);', 'usage', '--a'],
])('%s', (css, kind, name) => {
	const [match] = extract_mixins(first_atrule(css))
	expect(match).toMatchObject({ kind, name, value: name })
	expect(css.slice(match!.start_offset, match!.end_offset)).toBe(name)
})

test('other at-rules have no mixins', () => {
	expect(extract_mixins(first_atrule('@media print {}'))).toEqual([])
})

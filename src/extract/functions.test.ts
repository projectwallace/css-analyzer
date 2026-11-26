import { test, expect } from 'vitest'
import { parse, parse_value } from '@projectwallace/css-parser'
import { extract_functions } from './functions.ts'

test('finds the definition of a function', () => {
	const css = '@function --neg(--a <length>) returns <length> { result: 1 }'
	const [match] = extract_functions(parse(css).first_child!)
	expect(match).toMatchObject({ kind: 'definition', name: '--neg', value: '--neg' })
	expect(css.slice(match!.start_offset, match!.end_offset)).toBe('--neg')
})

test('finds the usages of functions in a value', () => {
	const matches = extract_functions(parse_value('calc(--a(1px) + 2px) --b() var(--c)'))
	expect(matches.map((m) => [m.name, m.kind])).toEqual([
		['--a', 'usage'],
		['--b', 'usage'],
	])
})

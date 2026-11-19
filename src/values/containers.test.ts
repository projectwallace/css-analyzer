import { test, expect } from 'vitest'
import { parse_value } from '@projectwallace/css-parser/parse-value'
import { get_declared_container_names } from './containers.ts'

test.each([
	['sidebar', ['sidebar']],
	['sidebar card', ['sidebar', 'card']],
	['sidebar / inline-size', ['sidebar']],
	['sidebar card / size', ['sidebar', 'card']],
	['--my-container / normal', ['--my-container']],
	['none', []],
	['initial', []],
	['/ inline-size', []],
])('get_declared_container_names("%s") is %j', (value, expected) => {
	expect(get_declared_container_names(value).map((match) => match.value)).toEqual(expected)
})

test('get_declared_container_names accepts a parsed node', () => {
	expect(
		get_declared_container_names(parse_value('a b / size')).map((match) => match.value),
	).toEqual(['a', 'b'])
})

test('locates the names', () => {
	const value = 'sidebar card / size'
	const matches = get_declared_container_names(value)
	expect(matches.map((match) => value.slice(match.start_offset, match.end_offset))).toEqual([
		'sidebar',
		'card',
	])
	expect(matches[1]).toMatchObject({ value: 'card', line: 1, column: 9 })
})

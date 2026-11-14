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
	expect(get_declared_container_names(value)).toEqual(expected)
})

test('get_declared_container_names accepts a parsed node', () => {
	expect(get_declared_container_names(parse_value('a b / size'))).toEqual(['a', 'b'])
})

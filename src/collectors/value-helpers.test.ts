import { test, expect } from 'vitest'
import { parse_value } from '@projectwallace/css-parser/parse-value'
import { analyze } from '../engine/analyzer.ts'
import { define_collector } from '../engine/define-collector.ts'
import { get_animation_names, get_first_identifier, get_list_items } from './value-helpers.ts'

function names_of(css: string): string[][] {
	const found: string[][] = []
	const collector = define_collector<number>(() => ({
		parse: { values: true },
		declaration: {
			enter(_node, ctx) {
				found.push(get_animation_names(ctx))
			},
		},
		result: () => found.length,
	}))
	analyze(css, { collector })
	return found
}

test.each([
	['animation-name: foo', ['foo']],
	['animation-name: "x y", foo', ['x y', 'foo']],
	['animation-name: none', []],
	['animation-name: inherit', []],
	['animation: 1s ease foo', ['foo']],
	['animation: inherit', []],
	['color: red', []],
	['animation-duration: 1s', []],
])('get_animation_names("%s")', (declaration, expected) => {
	expect(names_of(`a { ${declaration} }`)).toEqual([expected])
})

test('get_list_items skips the separators', () => {
	expect(get_list_items(parse_value('a, b / c')).map((item) => item.text)).toEqual(['a', 'b', 'c'])
})

test('get_first_identifier gives the name inside a function, or undefined', () => {
	expect(get_first_identifier(parse_value('var(--x)').first_child!)).toBe('--x')
	expect(get_first_identifier(parse_value('var(1px)').first_child!)).toBeUndefined()
	expect(get_first_identifier(parse_value('var()').first_child!)).toBeUndefined()
})

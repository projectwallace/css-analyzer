import { test, expect } from 'vitest'
import { parse_value } from '@projectwallace/css-parser/parse-value'
import { extract_colors } from './index.ts'

test.each<[string, string, [string, string][]]>([
	['color', '#FFF', [['#FFF', 'hex3']]],
	['color', '#112233ff', [['#112233ff', 'hex8']]],
	['color', 'red', [['red', 'named']]],
	['color', 'ButtonText', [['ButtonText', 'system']]],
	['color', 'currentColor', [['currentColor', 'currentcolor']]],
	['color', 'transparent', [['transparent', 'transparent']]],
	['color', 'rgb(0 0 0 / 50%)', [['rgb(0 0 0 / 50%)', 'rgb']]],
	[
		'background',
		'linear-gradient(red, #00f)',
		[
			['red', 'named'],
			['#00f', 'hex3'],
		],
	],
	['border', '1px solid RED', [['RED', 'named']]],
	['--brand', 'red', [['red', 'named']]],
	['unknown', 'blue', [['blue', 'named']]],
	['COLOR', 'red', [['red', 'named']]],
	['-webkit-box-shadow', '0 0 red', [['red', 'named']]],
	['color', '#fff\\9', [['#fff', 'hex3']]],
])('extract_colors("%s", "%s")', (property, value, expected) => {
	expect(extract_colors(property, value).map((match) => [match.value, match.format])).toEqual(
		expected,
	)
})

test.each([
	['font-family', 'Black, Red'],
	['font', '12px Black'],
	['animation-name', 'red'],
	['animation', 'red 1s'],
	['transition', 'red 1s'],
	['z-index', '1'],
	['width', '10px'],
	['color', 'inherit'],
	['color', 'ab'],
])('extract_colors finds nothing in %s: %s', (property, value) => {
	expect(extract_colors(property, value)).toEqual([])
})

test('accepts a parsed value as well as text', () => {
	expect(extract_colors('color', parse_value('red'))).toEqual(extract_colors('color', 'red'))
})

test('points at every color', () => {
	const value = '1px solid red, 0 0 #00F'
	const found = extract_colors('border', value)
	expect(found.map((match) => value.slice(match.start_offset, match.end_offset))).toEqual([
		'red',
		'#00F',
	])
	expect(found[1]).toMatchObject({
		value: '#00F',
		line: 1,
		column: 20,
		start_offset: 19,
		end_offset: 23,
	})
})

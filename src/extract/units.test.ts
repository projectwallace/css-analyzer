import { test, expect } from 'vitest'
import { parse_value } from '@projectwallace/css-parser/parse-value'
import { extract_units } from './index.ts'

test.each([
	['width', '10px', ['px']],
	['margin', '1px 2EM 3rem', ['px', 'EM', 'rem']],
	['transition', 'opacity 200ms ease 1s', ['ms', 's']],
	['animation', 'spin 2s', ['s']],
	['width', 'calc(100% - 2px)', ['%', 'px']],
	['rotate', '45deg', ['deg']],
	['--gap', '4px', ['px']],
	['WIDTH', '10px', ['px']],
	['width', '10px\\9', ['px']],
	['width', '0\\9', []],
	['width', '12', []],
	['font-family', 'Arial 10px', []],
	['z-index', '10px', []],
])('extract_units("%s", "%s") is %j', (property, value, expected) => {
	expect(extract_units(property, value).map((match) => match.value)).toEqual(expected)
})

test('accepts a parsed value as well as text', () => {
	expect(extract_units('width', parse_value('10px'))).toEqual(extract_units('width', '10px'))
})

test('points at the dimension', () => {
	const value = '1px 22em'
	const found = extract_units('margin', value)
	expect(found).toMatchObject([
		{ value: 'px', line: 1, column: 1, offset: 0, length: 3 },
		{ value: 'em', line: 1, column: 5, offset: 4, length: 4 },
	])
})

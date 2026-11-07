import { test, expect } from 'vitest'
import { parse_value } from '@projectwallace/css-parser/parse-value'
import { is_value_reset, keywords } from './values.js'

test.each(['0', '0px', '-0', '+0', '-0.0e0', '0 0px 0em 0pc 0vw', '0px 0dvh 0rem 0in'])(
	'"%s" is a reset',
	(value) => {
		expect(is_value_reset(value)).toBe(true)
	},
)

test.each(['1', '0 1px', '10px 10px', 'auto 10px', '10px auto', '1e-1', 'var(--x)'])(
	'"%s" is not a reset',
	(value) => {
		expect(is_value_reset(value)).toBe(false)
	},
)

test('is_value_reset accepts a parsed value', () => {
	expect(is_value_reset(parse_value('0 0px'))).toBe(true)
	expect(is_value_reset(parse_value('0 1px'))).toBe(false)
})

test.each(['inherit', 'INITIAL', 'Unset', 'revert', 'revert-layer', 'none', 'auto'])(
	'"%s" is a keyword, whatever the case',
	(keyword) => {
		expect(keywords.has(keyword)).toBe(true)
	},
)

test('other values are not keywords', () => {
	expect(keywords.has('red')).toBe(false)
})

import { test, expect } from 'vitest'
import {
	is_border_radius_property,
	is_hack,
	is_shorthand_property,
	is_spacing_reset_property,
} from './property-utils.ts'

test.each(['*zoom', '_height', '+color', '&color', '$color', '#color', '/color'])(
	'"%s" is a hack',
	(property) => {
		expect(is_hack(property)).toBe(true)
	},
)

test.each(['color', '--custom', '-webkit-transition', 'zoom'])('"%s" is not a hack', (property) => {
	expect(is_hack(property)).toBe(false)
})

test.each(['margin', 'FONT', '-webkit-transition', '*border'])(
	'"%s" is a shorthand property',
	(property) => {
		expect(is_shorthand_property(property)).toBe(true)
	},
)

test.each(['color', '--margin', 'margin-top'])('"%s" is not a shorthand property', (property) => {
	expect(is_shorthand_property(property)).toBe(false)
})

test.each([
	'margin',
	'PADDING',
	'margin-inline-start',
	'margin-inline-end',
	'padding-block-end',
	'*margin-left',
	'_padding-top',
])('"%s" is a spacing reset property', (property) => {
	expect(is_spacing_reset_property(property)).toBe(true)
})

test.each(['gap', 'margin-collapse', '--margin', 'border'])(
	'"%s" is not a spacing reset property',
	(property) => {
		expect(is_spacing_reset_property(property)).toBe(false)
	},
)

test.each([
	'border-radius',
	'BORDER-RADIUS',
	'border-top-left-radius',
	'-webkit-border-radius',
	'border-start-end-radius',
])('"%s" is a border radius property', (property) => {
	expect(is_border_radius_property(property)).toBe(true)
})

test.each(['border', 'radius', 'border-top-width'])(
	'"%s" is not a border radius property',
	(property) => {
		expect(is_border_radius_property(property)).toBe(false)
	},
)

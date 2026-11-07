import { test, expect } from 'vitest'
import {
	basename,
	border_radius_properties,
	is_hack,
	shorthand_properties,
	SPACING_RESET_PROPERTIES,
} from './property-utils.js'

test.each([
	['color', 'color'],
	['COLOR', 'color'],
	['-webkit-Transition', 'transition'],
	['-moz-border-radius', 'border-radius'],
	['*zoom', 'zoom'],
	['_HEIGHT', 'height'],
	['--Custom', '--Custom'],
])('basename of "%s" is "%s"', (property, expected) => {
	expect(basename(property)).toBe(expected)
})

test.each(['*zoom', '_height', '+color', '&color', '$color', '#color', '/color'])(
	'"%s" is a hack',
	(property) => {
		expect(is_hack(property)).toBe(true)
	},
)

test.each(['color', '--custom', '-webkit-transition', 'zoom'])('"%s" is not a hack', (property) => {
	expect(is_hack(property)).toBe(false)
})

test('knows shorthands, spacing resets and border radii', () => {
	expect(shorthand_properties.has('margin')).toBe(true)
	expect(shorthand_properties.has('color')).toBe(false)
	expect(SPACING_RESET_PROPERTIES.has('padding')).toBe(true)
	expect(border_radius_properties.has('BORDER-RADIUS')).toBe(true)
	expect(border_radius_properties.has('border-top-left-radius')).toBe(true)
})

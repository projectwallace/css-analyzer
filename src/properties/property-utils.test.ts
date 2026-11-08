import { test, expect } from 'vitest'
import {
	border_radius_properties,
	is_hack,
	shorthand_properties,
	spacing_reset_properties,
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

test('knows shorthands, spacing resets and border radii', () => {
	expect(shorthand_properties.has('margin')).toBe(true)
	expect(shorthand_properties.has('color')).toBe(false)
	expect(spacing_reset_properties.has('padding')).toBe(true)
	expect(border_radius_properties.has('BORDER-RADIUS')).toBe(true)
	expect(border_radius_properties.has('border-top-left-radius')).toBe(true)
})

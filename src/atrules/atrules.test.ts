import { test, expect } from 'vitest'
import { type Atrule, parse } from '@projectwallace/css-parser'
import { get_media_browserhacks, get_supports_browserhacks } from './index.ts'

function prelude_of(css: string) {
	const atrule = parse(css, { parse_atrule_preludes: true }).first_child as Atrule
	return atrule.prelude!
}

test('get_media_browserhacks finds hacks in prelude text and nodes', () => {
	expect(get_media_browserhacks('\\0screen')).toEqual(['\\0'])
	expect(get_media_browserhacks('(-ms-high-contrast: none)')).toEqual(['-ms-high-contrast'])
	expect(get_media_browserhacks('screen and (min-width: 600px)')).toEqual([])

	const prelude = prelude_of('@media (-ms-high-contrast: none) {}')
	expect(get_media_browserhacks(prelude)).toEqual(['-ms-high-contrast'])
})

test('get_supports_browserhacks finds hacks in prelude text and nodes', () => {
	expect(get_supports_browserhacks('(-webkit-appearance: none)')).toEqual([
		'-webkit-appearance: none',
	])
	expect(get_supports_browserhacks('(display: grid)')).toEqual([])

	const prelude = prelude_of('@supports (-moz-appearance: meterbar) {}')
	expect(get_supports_browserhacks(prelude)).toEqual(['-moz-appearance: meterbar'])
})

test('get_supports_browserhacks finds hacks in uppercase prelude text and nodes', () => {
	expect(get_supports_browserhacks('(-WEBKIT-APPEARANCE: NONE)')).toEqual([
		'-webkit-appearance: none',
	])

	const prelude = prelude_of('@supports (-MOZ-APPEARANCE: METERBAR) {}')
	expect(get_supports_browserhacks(prelude)).toEqual(['-moz-appearance: meterbar'])
})

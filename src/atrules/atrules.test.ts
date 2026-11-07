import { test, expect } from 'vitest'
import { parse_atrule_prelude } from '@projectwallace/css-parser'
import { get_media_browserhacks, get_supports_browserhacks } from './index.js'

test('get_media_browserhacks finds hacks in prelude text and nodes', () => {
	expect(get_media_browserhacks('\\0screen')).toEqual(['\\0'])
	expect(get_media_browserhacks('(-ms-high-contrast: none)')).toEqual(['-ms-high-contrast'])
	expect(get_media_browserhacks('screen and (min-width: 600px)')).toEqual([])

	const [prelude] = parse_atrule_prelude('media', '(-ms-high-contrast: none)')
	expect(get_media_browserhacks(prelude!)).toEqual(['-ms-high-contrast'])
})

test('get_supports_browserhacks finds hacks in prelude text and nodes', () => {
	expect(get_supports_browserhacks('(-webkit-appearance: none)')).toEqual([
		'-webkit-appearance: none',
	])
	expect(get_supports_browserhacks('(display: grid)')).toEqual([])

	const [prelude] = parse_atrule_prelude('supports', '(-moz-appearance: meterbar)')
	expect(get_supports_browserhacks(prelude!)).toEqual(['-moz-appearance: meterbar'])
})

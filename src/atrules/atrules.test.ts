import { test, expect } from 'vitest'
import { type Atrule, parse } from '@projectwallace/css-parser'
import {
	get_container_query_name,
	get_media_browserhacks,
	get_supports_browserhacks,
} from './index.ts'

function texts(matches: { value: string }[]): string[] {
	return matches.map((match) => match.value)
}

function prelude_of(css: string) {
	const atrule = parse(css, { parse_atrule_preludes: true }).first_child as Atrule
	return atrule.prelude!
}

test('get_media_browserhacks finds hacks in prelude text and nodes', () => {
	expect(texts(get_media_browserhacks('\\0screen'))).toEqual(['\\0'])
	expect(texts(get_media_browserhacks('(-ms-high-contrast: none)'))).toEqual(['-ms-high-contrast'])
	expect(texts(get_media_browserhacks('screen and (min-width: 600px)'))).toEqual([])

	const prelude = prelude_of('@media (-ms-high-contrast: none) {}')
	expect(texts(get_media_browserhacks(prelude))).toEqual(['-ms-high-contrast'])
})

test('get_supports_browserhacks finds hacks in prelude text and nodes', () => {
	expect(texts(get_supports_browserhacks('(-webkit-appearance: none)'))).toEqual([
		'-webkit-appearance: none',
	])
	expect(texts(get_supports_browserhacks('(display: grid)'))).toEqual([])

	const prelude = prelude_of('@supports (-moz-appearance: meterbar) {}')
	expect(texts(get_supports_browserhacks(prelude))).toEqual(['-moz-appearance: meterbar'])
})

test('get_supports_browserhacks finds hacks in uppercase prelude text and nodes', () => {
	expect(texts(get_supports_browserhacks('(-WEBKIT-APPEARANCE: NONE)'))).toEqual([
		'-webkit-appearance: none',
	])

	const prelude = prelude_of('@supports (-MOZ-APPEARANCE: METERBAR) {}')
	expect(texts(get_supports_browserhacks(prelude))).toEqual(['-moz-appearance: meterbar'])
})

test.each([
	['sidebar (min-width: 400px)', 'sidebar'],
	['page-layout (block-size > 12em)', 'page-layout'],
	['--my-container (width > 1px)', '--my-container'],
	['(min-width: 400px)', undefined],
	['style(--responsive: true)', undefined],
])(
	'get_container_query_name("%s") is %s, for text and for a parsed prelude',
	(prelude, expected) => {
		expect(get_container_query_name(prelude)?.value).toBe(expected)
		expect(get_container_query_name(prelude_of(`@container ${prelude} {}`))?.value).toBe(expected)
	},
)

test('get_container_query_name is null for an empty prelude', () => {
	expect(get_container_query_name('')).toBeNull()
})

test('the browserhack matches say where the hack is', () => {
	expect(get_media_browserhacks('screen and (-ms-high-contrast: none)')).toMatchObject([
		{ value: '-ms-high-contrast', line: 1, start_offset: 11 },
	])
})

test('get_container_query_name locates the name', () => {
	expect(get_container_query_name('sidebar (min-width: 400px)')).toEqual({
		value: 'sidebar',
		line: 1,
		column: 1,
		start_offset: 0,
		end_offset: 7,
		length: 7,
	})
})

import { test, expect } from 'vitest'
import {
	get_container_query_name,
	get_media_browserhacks,
	get_supports_browserhacks,
} from './index.ts'
import { parse_prelude } from '../test/test-utils.ts'

function texts(matches: { value: string }[]): string[] {
	return matches.map((match) => match.value)
}

test.each([
	['\\0screen', ['\\0']],
	['(-ms-high-contrast: none)', ['-ms-high-contrast']],
	['screen and (min-width: 600px)', []],
])('get_media_browserhacks("%s") is %j', (prelude, expected) => {
	expect(texts(get_media_browserhacks(parse_prelude('media', prelude)))).toEqual(expected)
})

test.each([
	['(-webkit-appearance: none)', ['-webkit-appearance: none']],
	['(-moz-appearance: meterbar)', ['-moz-appearance: meterbar']],
	['(-WEBKIT-APPEARANCE: NONE)', ['-webkit-appearance: none']],
	['(-MOZ-APPEARANCE: METERBAR)', ['-moz-appearance: meterbar']],
	['(display: grid)', []],
])('get_supports_browserhacks("%s") is %j', (prelude, expected) => {
	expect(texts(get_supports_browserhacks(parse_prelude('supports', prelude)))).toEqual(expected)
})

test.each([
	['sidebar (min-width: 400px)', 'sidebar'],
	['page-layout (block-size > 12em)', 'page-layout'],
	['--my-container (width > 1px)', '--my-container'],
	['(min-width: 400px)', undefined],
	['style(--responsive: true)', undefined],
])('get_container_query_name("%s") is %s', (prelude, expected) => {
	expect(get_container_query_name(parse_prelude('container', prelude))?.value).toBe(expected)
})

test('the browserhack matches say where the hack is', () => {
	// Offsets are relative to `@media screen and (-ms-high-contrast: none) {}`
	expect(
		get_media_browserhacks(parse_prelude('media', 'screen and (-ms-high-contrast: none)')),
	).toMatchObject([{ value: '-ms-high-contrast', line: 1, start_offset: 18, end_offset: 43 }])
})

test('get_container_query_name locates the name', () => {
	// Offsets are relative to `@container sidebar (min-width: 400px) {}`
	expect(
		get_container_query_name(parse_prelude('container', 'sidebar (min-width: 400px)')),
	).toMatchObject({ value: 'sidebar', line: 1, start_offset: 11, end_offset: 18 })
})

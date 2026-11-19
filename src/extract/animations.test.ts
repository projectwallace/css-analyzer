import { test, expect } from 'vitest'
import { parse_value } from '@projectwallace/css-parser/parse-value'
import {
	duration_properties,
	extract_durations,
	extract_timing_functions,
	timing_function_properties,
} from './index.ts'

function values(matches: { value: string }[]): string[] {
	return matches.map((match) => match.value)
}

test.each([
	['transition', 'opacity 200ms ease 50ms, color 1s', ['200ms', '1s']],
	['animation', 'spin 2s linear infinite', ['2s']],
	['TRANSITION', 'opacity 1S', ['1S']],
	['-webkit-transition', 'opacity 1s', ['1s']],
	['transition-duration', '1s, 200ms', ['1s', '200ms']],
	['animation-duration', 'var(--d)', ['var(--d)']],
	['transition', 'none', []],
	['animation-duration', 'inherit', []],
	['transition-delay', '1s', []],
	['width', '1s', []],
])('extract_durations("%s", "%s") is %j', (property, value, expected) => {
	expect(values(extract_durations(property, value))).toEqual(expected)
})

test.each([
	['transition', 'opacity 200ms ease-in-out, color 1s steps(4)', ['ease-in-out', 'steps(4)']],
	['animation', 'spin 2s cubic-bezier(0, 0, 1, 1)', ['cubic-bezier(0, 0, 1, 1)']],
	['transition-timing-function', 'ease, linear', ['ease', 'linear']],
	['animation-timing-function', 'steps(2, end)', ['steps(2, end)']],
	['transition', 'inherit', []],
	['transition-duration', '1s', []],
])('extract_timing_functions("%s", "%s") is %j', (property, value, expected) => {
	expect(values(extract_timing_functions(property, value))).toEqual(expected)
})

test('accept a parsed value as well as text', () => {
	const value = 'opacity 1s ease'
	expect(extract_durations('transition', parse_value(value))).toEqual(
		extract_durations('transition', value),
	)
	expect(extract_timing_functions('transition', parse_value(value))).toEqual(
		extract_timing_functions('transition', value),
	)
})

test('point at every item', () => {
	const value = 'opacity 200ms ease, color 1s linear'
	const durations = extract_durations('transition', value)
	const functions = extract_timing_functions('transition', value)
	expect(
		[...durations, ...functions].map((m) => value.slice(m.start_offset, m.end_offset)),
	).toEqual(['200ms', '1s', 'ease', 'linear'])
	expect(durations[1]).toMatchObject({
		line: 1,
		column: 27,
		start_offset: 26,
		end_offset: 28,
	})
})

test('the property filters know the shorthands and the longhands', () => {
	expect(duration_properties.has('Transition')).toBe(true)
	expect(duration_properties.has('animation-duration')).toBe(true)
	expect(duration_properties.has('transition-delay')).toBe(false)
	expect(timing_function_properties.has('transition-timing-function')).toBe(true)
	expect(timing_function_properties.has('transition-duration')).toBe(false)
})

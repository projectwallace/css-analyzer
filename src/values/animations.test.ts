// oxlint-disable vitest/no-conditional-in-test
import { test } from 'vitest'
import { expect } from 'vitest'
import { parse_value } from '@projectwallace/css-parser/parse-value'
import { analyze_animation, analyze_transition, get_animation_names } from './animations.ts'
import type { Match } from '../utils/location.ts'

// The text of every part, for readable expectations
function texts(parts: Record<string, Match[]>): Record<string, string[]> {
	return Object.fromEntries(
		Object.entries(parts).map(([key, matches]) => [key, matches.map((match) => match.value)]),
	)
}

function names_of(value: string): string[] {
	return analyze_animation(value).names.map((match) => match.value)
}

test('emits name for custom animation name identifier', () => {
	const names = names_of('slide-in 300ms ease-out forwards')
	expect(names).toEqual(['slide-in'])
})

test('emits name for each animation in a value list', () => {
	const names = names_of('slide-in 1s, fade-out 2s')
	expect(names).toEqual(['slide-in', 'fade-out'])
})

test('does not emit name for animation direction keywords', () => {
	const names: string[] = []
	for (const kw of ['normal', 'reverse', 'alternate', 'alternate-reverse']) {
		names.push(...names_of(`my-anim 1s ${kw}`))
	}
	expect(names).toEqual(['my-anim', 'my-anim', 'my-anim', 'my-anim'])
})

test('does not emit name for animation fill-mode keywords', () => {
	const names: string[] = []
	for (const kw of ['forwards', 'backwards', 'both']) {
		names.push(...names_of(`my-anim 1s ${kw}`))
	}
	expect(names).toEqual(['my-anim', 'my-anim', 'my-anim'])
})

test('does not emit name for animation play-state keywords', () => {
	const names: string[] = []
	for (const kw of ['running', 'paused']) {
		names.push(...names_of(`my-anim 1s ${kw}`))
	}
	expect(names).toEqual(['my-anim', 'my-anim'])
})

test('does not emit name for infinite iteration-count', () => {
	const names = names_of('my-anim 1s infinite')
	expect(names).toEqual(['my-anim'])
})

test('does not emit name for timing-function keywords', () => {
	const names: string[] = []
	for (const kw of [
		'ease',
		'linear',
		'ease-in',
		'ease-out',
		'ease-in-out',
		'step-start',
		'step-end',
	]) {
		names.push(...names_of(`my-anim 1s ${kw}`))
	}
	expect(names).toEqual([
		'my-anim',
		'my-anim',
		'my-anim',
		'my-anim',
		'my-anim',
		'my-anim',
		'my-anim',
	])
})

test('does not emit name for none keyword', () => {
	const names = names_of('none')
	expect(names).toEqual([])
})

test('emits name for dashed-ident animation names', () => {
	const names = names_of('--my-name 1s ease-in')
	expect(names).toEqual(['--my-name'])
})

test('emits name for quoted (string) animation names', () => {
	const names = names_of('"slide in" 300ms ease-out')
	expect(names).toEqual(['"slide in"'])
})

test('emits name for each quoted animation in a value list', () => {
	const names = names_of('"slide in" 1s, "fade out" 2s')
	expect(names).toEqual(['"slide in"', '"fade out"'])
})

test('emits name for a quoted keyword used as animation name', () => {
	// Unlike the bare `none` keyword, a quoted "none" is a valid animation name
	const names: string[] = []
	for (const kw of ['none', 'infinite', 'paused', 'alternate', 'linear']) {
		names.push(...names_of(`"${kw}" 1s ease-in`))
	}
	expect(names).toEqual(['"none"', '"infinite"', '"paused"', '"alternate"', '"linear"'])
})

test('splits a shorthand into plain-data parts', () => {
	expect(texts(analyze_animation('slide-in 300ms ease-out, none 1s infinite'))).toEqual({
		durations: ['300ms', '1s'],
		delays: [],
		timing_functions: ['ease-out'],
		names: ['slide-in'],
		keywords: ['none'],
	})
})

test('accepts a parsed node as well as text', () => {
	const node = parse_value('fade 1s cubic-bezier(0, 0, 1, 1)')
	expect(analyze_animation(node)).toEqual(analyze_animation('fade 1s cubic-bezier(0, 0, 1, 1)'))
})

test('splits the delay from the duration, per layer', () => {
	expect(texts(analyze_animation('spin 2s linear 100ms, fade 1s')).delays).toEqual(['100ms'])
	expect(texts(analyze_animation('spin 2s linear 100ms, fade 1s 3s'))).toMatchObject({
		durations: ['2s', '1s'],
		delays: ['100ms', '3s'],
	})
})

test('analyze_transition splits a transition into plain-data parts', () => {
	expect(texts(analyze_transition('opacity 200ms ease-in-out 0s, transform 300ms linear'))).toEqual(
		{
			properties: ['opacity', 'transform'],
			durations: ['200ms', '300ms'],
			delays: ['0s'],
			timing_functions: ['ease-in-out', 'linear'],
			keywords: [],
		},
	)
})

test.each([
	['all 1s', ['all']],
	['--brand-color 1s, margin-left 2s', ['--brand-color', 'margin-left']],
	['none', []],
	['inherit', []],
])('analyze_transition("%s") finds the properties %j', (value, properties) => {
	expect(texts(analyze_transition(value)).properties).toEqual(properties)
})

test('analyze_transition finds timing functions, global keywords and accepts a parsed node', () => {
	expect(
		texts(analyze_transition('color 1s cubic-bezier(0, 0, 1, 1), width 2s steps(4)')),
	).toMatchObject({
		timing_functions: ['cubic-bezier(0, 0, 1, 1)', 'steps(4)'],
	})
	expect(texts(analyze_transition('inherit')).keywords).toEqual(['inherit'])
	const node = parse_value('opacity 1s ease')
	expect(analyze_transition(node)).toEqual(analyze_transition('opacity 1s ease'))
})

test.each([
	['slide-in', ['slide-in']],
	['slide-in, "fade-out", none', ['slide-in', 'fade-out']],
	['"slide in", --my-name', ['slide in', '--my-name']],
	['none', []],
	['initial', []],
])('get_animation_names("%s") is %j', (value, expected) => {
	expect(get_animation_names(value).map((match) => match.value)).toEqual(expected)
})

test('get_animation_names accepts a parsed node', () => {
	expect(get_animation_names(parse_value('a, "b"')).map((match) => match.value)).toEqual(['a', 'b'])
})

test('locates every part, as written', () => {
	const value = 'slide-in 300ms ease-out 1s, "my name" 2s'
	const parts = analyze_animation(value)
	for (const match of Object.values(parts).flat()) {
		expect(value.slice(match.start_offset, match.end_offset)).toBe(match.value)
	}
	expect(parts.delays[0]).toMatchObject({
		value: '1s',
		line: 1,
		column: 25,
		start_offset: 24,
		end_offset: 26,
	})
})

test('get_animation_names locates the quoted name, without quotes in the text', () => {
	expect(get_animation_names('a, "b c"')[1]).toEqual({
		value: 'b c',
		line: 1,
		column: 4,
		start_offset: 3,
		end_offset: 8,
	})
})

// oxlint-disable vitest/no-conditional-in-test
import { test } from 'vitest'
import { expect } from 'vitest'
import { parse_value } from '@projectwallace/css-parser/parse-value'
import { analyze_animation, analyze_transition, get_animation_names } from './animations.ts'

test('emits name for custom animation name identifier', () => {
	const names = analyze_animation('slide-in 300ms ease-out forwards').names
	expect(names).toEqual(['slide-in'])
})

test('emits name for each animation in a value list', () => {
	const names = analyze_animation('slide-in 1s, fade-out 2s').names
	expect(names).toEqual(['slide-in', 'fade-out'])
})

test('does not emit name for animation direction keywords', () => {
	const names: string[] = []
	for (const kw of ['normal', 'reverse', 'alternate', 'alternate-reverse']) {
		names.push(...analyze_animation(`my-anim 1s ${kw}`).names)
	}
	expect(names).toEqual(['my-anim', 'my-anim', 'my-anim', 'my-anim'])
})

test('does not emit name for animation fill-mode keywords', () => {
	const names: string[] = []
	for (const kw of ['forwards', 'backwards', 'both']) {
		names.push(...analyze_animation(`my-anim 1s ${kw}`).names)
	}
	expect(names).toEqual(['my-anim', 'my-anim', 'my-anim'])
})

test('does not emit name for animation play-state keywords', () => {
	const names: string[] = []
	for (const kw of ['running', 'paused']) {
		names.push(...analyze_animation(`my-anim 1s ${kw}`).names)
	}
	expect(names).toEqual(['my-anim', 'my-anim'])
})

test('does not emit name for infinite iteration-count', () => {
	const names = analyze_animation('my-anim 1s infinite').names
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
		names.push(...analyze_animation(`my-anim 1s ${kw}`).names)
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
	const names = analyze_animation('none').names
	expect(names).toEqual([])
})

test('emits name for dashed-ident animation names', () => {
	const names = analyze_animation('--my-name 1s ease-in').names
	expect(names).toEqual(['--my-name'])
})

test('emits name for quoted (string) animation names', () => {
	const names = analyze_animation('"slide in" 300ms ease-out').names
	expect(names).toEqual(['"slide in"'])
})

test('emits name for each quoted animation in a value list', () => {
	const names = analyze_animation('"slide in" 1s, "fade out" 2s').names
	expect(names).toEqual(['"slide in"', '"fade out"'])
})

test('emits name for a quoted keyword used as animation name', () => {
	// Unlike the bare `none` keyword, a quoted "none" is a valid animation name
	const names: string[] = []
	for (const kw of ['none', 'infinite', 'paused', 'alternate', 'linear']) {
		names.push(...analyze_animation(`"${kw}" 1s ease-in`).names)
	}
	expect(names).toEqual(['"none"', '"infinite"', '"paused"', '"alternate"', '"linear"'])
})

test('splits a shorthand into plain-data parts', () => {
	expect(analyze_animation('slide-in 300ms ease-out, none 1s infinite')).toEqual({
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
	expect(analyze_animation('spin 2s linear 100ms, fade 1s').delays).toEqual(['100ms'])
	expect(analyze_animation('spin 2s linear 100ms, fade 1s 3s')).toMatchObject({
		durations: ['2s', '1s'],
		delays: ['100ms', '3s'],
	})
})

test('analyze_transition splits a transition into plain-data parts', () => {
	expect(analyze_transition('opacity 200ms ease-in-out 0s, transform 300ms linear')).toEqual({
		properties: ['opacity', 'transform'],
		durations: ['200ms', '300ms'],
		delays: ['0s'],
		timing_functions: ['ease-in-out', 'linear'],
		keywords: [],
	})
})

test.each([
	['all 1s', ['all']],
	['--brand-color 1s, margin-left 2s', ['--brand-color', 'margin-left']],
	['none', []],
	['inherit', []],
])('analyze_transition("%s") finds the properties %j', (value, properties) => {
	expect(analyze_transition(value).properties).toEqual(properties)
})

test('analyze_transition finds timing functions, global keywords and accepts a parsed node', () => {
	expect(analyze_transition('color 1s cubic-bezier(0, 0, 1, 1), width 2s steps(4)')).toMatchObject({
		timing_functions: ['cubic-bezier(0, 0, 1, 1)', 'steps(4)'],
	})
	expect(analyze_transition('inherit').keywords).toEqual(['inherit'])
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
	expect(get_animation_names(value)).toEqual(expected)
})

test('get_animation_names accepts a parsed node', () => {
	expect(get_animation_names(parse_value('a, "b"'))).toEqual(['a', 'b'])
})

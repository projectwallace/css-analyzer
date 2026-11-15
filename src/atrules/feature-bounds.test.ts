import { test, expect } from 'vitest'
import { type Atrule, parse } from '@projectwallace/css-parser'
import { get_feature_bounds } from './index.ts'

type Short = [feature: string, direction: string, value: number, unit: string, inclusive: boolean]

// The bounds without their location
function short(input: Parameters<typeof get_feature_bounds>[0], name?: 'media' | 'container') {
	return get_feature_bounds(input, name).map((bound): Short => [
		bound.feature,
		bound.direction,
		bound.value,
		bound.unit,
		bound.inclusive,
	])
}

function prelude_of(css: string) {
	return (parse(css, { parse_atrule_preludes: true }).first_child as Atrule).prelude!
}

test.each<[string, Short[]]>([
	['(min-width: 400px)', [['width', 'min', 400, 'px', true]]],
	['(MAX-WIDTH:50em)', [['width', 'max', 50, 'em', true]]],
	['(width: 600px)', [['width', 'equal', 600, 'px', true]]],
	['(min-width: 0)', [['width', 'min', 0, '', true]]],
	['(min-resolution: 2dppx)', [['resolution', 'min', 2, 'dppx', true]]],
	['(-webkit-min-device-pixel-ratio: 2)', [['-webkit-device-pixel-ratio', 'min', 2, '', true]]],
	['(width >= 400px)', [['width', 'min', 400, 'px', true]]],
	['(width > 400px)', [['width', 'min', 400, 'px', false]]],
	['(width <= 40em)', [['width', 'max', 40, 'em', true]]],
	['(width < 40em)', [['width', 'max', 40, 'em', false]]],
	['(width = 40em)', [['width', 'equal', 40, 'em', true]]],
	['(400px < width)', [['width', 'min', 400, 'px', false]]],
	['(400px <= width)', [['width', 'min', 400, 'px', true]]],
	['(400px > width)', [['width', 'max', 400, 'px', false]]],
	['(400px >= width)', [['width', 'max', 400, 'px', true]]],
	[
		'(50px <= width <= 100px)',
		[
			['width', 'min', 50, 'px', true],
			['width', 'max', 100, 'px', true],
		],
	],
	[
		'(50px < width < 100px)',
		[
			['width', 'min', 50, 'px', false],
			['width', 'max', 100, 'px', false],
		],
	],
	[
		'screen and (min-width: 400px) and (max-width: 600px)',
		[
			['width', 'min', 400, 'px', true],
			['width', 'max', 600, 'px', true],
		],
	],
	['(orientation: landscape)', []],
	['(min-aspect-ratio: 16/9)', []],
	['(min-width: calc(1px + 1px))', []],
	['screen', []],
])('get_feature_bounds("%s")', (prelude, expected) => {
	expect(short(prelude)).toEqual(expected)
	expect(short(prelude_of(`@media ${prelude} {}`))).toEqual(expected)
})

test('an empty prelude has no bounds', () => {
	expect(get_feature_bounds('')).toEqual([])
})

test.each<[string, Short[]]>([
	['sidebar (min-width: 400px)', [['width', 'min', 400, 'px', true]]],
	['(inline-size > 20em)', [['inline-size', 'min', 20, 'em', false]]],
	[
		'sidebar (400px <= width <= 800px)',
		[
			['width', 'min', 400, 'px', true],
			['width', 'max', 800, 'px', true],
		],
	],
	['style(--responsive: true)', []],
])('get_feature_bounds("%s", "container")', (prelude, expected) => {
	expect(short(prelude, 'container')).toEqual(expected)
	expect(short(prelude_of(`@container ${prelude} {}`), 'container')).toEqual(expected)
})

test('the bounds of comma separated queries have their own query number', () => {
	const css = '(min-width: 1px) and (max-width: 9px), (width > 5px)'
	expect(get_feature_bounds(css).map((bound) => bound.query)).toEqual([0, 0, 1])
	expect(get_feature_bounds(prelude_of(`@media ${css} {}`)).map((bound) => bound.query)).toEqual([
		0, 0, 1,
	])
})

test('or and not are not interpreted: their bounds are reported as they come', () => {
	expect(short('(min-width: 1px) or (max-width: 9px)')).toEqual([
		['width', 'min', 1, 'px', true],
		['width', 'max', 9, 'px', true],
	])
	expect(short('not all and (min-width: 1px)')).toEqual([['width', 'min', 1, 'px', true]])
})

test('a bound is located at its whole feature, and both bounds of a range share it', () => {
	const css = 'screen and (min-width: 400px), (50px <= height <= 100px)'
	const bounds = get_feature_bounds(css)
	expect(bounds.map((bound) => css.slice(bound.offset, bound.offset + bound.length))).toEqual([
		'(min-width: 400px)',
		'(50px <= height <= 100px)',
		'(50px <= height <= 100px)',
	])
	expect(bounds[0]).toMatchObject({ value: 400, line: 1 })
})

test('offsets of a parsed prelude are relative to its source', () => {
	const css = '@media (min-width: 400px) {}'
	const [bound] = get_feature_bounds(prelude_of(css))
	expect(css.slice(bound!.offset, bound!.offset + bound!.length)).toBe('(min-width: 400px)')
})

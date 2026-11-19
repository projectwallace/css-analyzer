import { test, expect } from 'vitest'
import { find_contradiction, get_query_bounds, get_static_features } from './conditions.ts'
import { get_feature_bounds } from './feature-bounds.ts'

test.each([
	['(width: 300px)', 'media', ['width']],
	['screen and (min-width: 300px)', 'media', []],
	['(min-width: 300px) and (height: 50px)', 'media', ['height']],
	['(width: 100px), (height: 100px)', 'media', ['width', 'height']],
	['(width >= 300px)', 'media', []],
	['(resolution: 2)', 'media', ['resolution']],
	['(orientation: landscape)', 'media', []],
	['(horizontal-viewport-segments: 2)', 'media', []],
	['not (width: 300px)', 'media', []],
	['(width: 300px) or (height: 300px)', 'media', []],
	['(width: 300px)', 'container', ['width']],
	['sidebar (min-width: 300px)', 'container', []],
	['url(a.css) screen and (width: 300px)', 'import', ['width']],
] as const)('get_static_features(%j, %s) is %j', (prelude, name, expected) => {
	expect(get_static_features(prelude, name).map((match) => match.value)).toEqual(expected)
})

test('get_static_features locates the whole feature', () => {
	const prelude = 'screen and (width: 300px)'
	const [match] = get_static_features(prelude)
	expect(prelude.slice(match!.start_offset, match!.end_offset)).toBe('(width: 300px)')
})

test('get_query_bounds gives one entry per query, and null for not/or', () => {
	const bounds = get_query_bounds('(min-width: 1px), not (max-width: 2px), (width < 3px) or (x)')
	expect(bounds[0]).toHaveLength(1)
	expect(bounds.slice(1)).toEqual([null, null])
})

test.each([
	['(min-width: 800px) and (max-width: 400px)'],
	['(width > 400px) and (width < 400px)'],
	['(min-width: 800PX) and (max-width: 400px)'],
	['(width: 100px) and (width: 200px)'],
])('find_contradiction(%j) finds width', (prelude) => {
	const [bounds] = get_query_bounds(prelude)
	expect(find_contradiction(bounds!)).toMatchObject({ feature: 'width' })
})

test.each([
	['(min-width: 400px) and (max-width: 400px)'],
	['(width >= 400px) and (width <= 400px)'],
	['(min-width: 800px) and (max-height: 400px)'],
	['(min-width: 800px) and (max-width: 400em)'],
	['(width: 100px) and (min-width: 50px)'],
])('find_contradiction(%j) is null', (prelude) => {
	const [bounds] = get_query_bounds(prelude)
	expect(find_contradiction(bounds!)).toBeNull()
})

test('find_contradiction names the tightest bounds', () => {
	const found = find_contradiction(
		get_feature_bounds('(min-width: 100px) and (min-width: 800px) and (max-width: 400px)'),
	)
	expect([found?.lower.value, found?.upper.value]).toEqual([800, 400])
})

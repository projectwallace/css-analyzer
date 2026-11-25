import { test, expect } from 'vitest'
import { find_contradiction, get_query_bounds, get_static_features } from './conditions.ts'
import { get_feature_bounds } from './feature-bounds.ts'
import { parse_prelude } from '../../test/test-utils.ts'

test.each([
	['(width: 300px)', 'media', ['width']],
	['screen and (min-width: 300px)', 'media', []],
	['(min-width: 300px) and (height: 50px)', 'media', ['height']],
	['(width: 100px), (height: 100px)', 'media', ['width', 'height']],
	['(width >= 300px)', 'media', []],
	['(resolution: 2)', 'media', ['resolution']],
	['(orientation: landscape)', 'media', []],
	['(horizontal-viewport-segments: 2)', 'media', []],
	['not (width: 300px)', 'media', ['width']],
	['(width: 300px) or (height: 300px)', 'media', ['width', 'height']],
	['(width: 300px)', 'container', ['width']],
	['sidebar (min-width: 300px)', 'container', []],
	['url(a.css) screen and (width: 300px)', 'import', ['width']],
] as const)('get_static_features(%j, %s) is %j', (prelude, name, expected) => {
	expect(get_static_features(parse_prelude(name, prelude)).map((match) => match.feature)).toEqual(
		expected,
	)
})

test('get_static_features locates the whole feature', () => {
	const css = '@media screen and (width: 300px) {}'
	const [match] = get_static_features(parse_prelude('media', 'screen and (width: 300px)'))
	expect(css.slice(match!.start_offset, match!.end_offset)).toBe('(width: 300px)')
})

test('get_query_bounds gives one entry per query, and says which have not/or', () => {
	const queries = get_query_bounds(
		parse_prelude('media', '(min-width: 1px), not (max-width: 2px), (width < 3px) or (x)'),
	)
	expect(queries.map((query) => query.complex)).toEqual([false, true, true])
	expect(queries[0]!.bounds).toHaveLength(1)
})

test('get_static_features says which features are in a query with not/or', () => {
	const features = get_static_features(
		parse_prelude('media', '(width: 1px), not (height: 2px), (resolution: 2dppx) or (x)'),
	)
	expect(features.map((feature) => [feature.feature, feature.complex])).toEqual([
		['width', false],
		['height', true],
		['resolution', true],
	])
})

test.each([
	['(min-width: 800px) and (max-width: 400px)'],
	['(width > 400px) and (width < 400px)'],
	['(min-width: 800PX) and (max-width: 400px)'],
	['(width: 100px) and (width: 200px)'],
])('find_contradiction(%j) finds width', (prelude) => {
	const [query] = get_query_bounds(parse_prelude('media', prelude))
	expect(find_contradiction(query!.bounds)).toMatchObject({ feature: 'width' })
})

test.each([
	['(min-width: 400px) and (max-width: 400px)'],
	['(width >= 400px) and (width <= 400px)'],
	['(min-width: 800px) and (max-height: 400px)'],
	['(min-width: 800px) and (max-width: 400em)'],
	['(width: 100px) and (min-width: 50px)'],
])('find_contradiction(%j) is null', (prelude) => {
	const [query] = get_query_bounds(parse_prelude('media', prelude))
	expect(find_contradiction(query!.bounds)).toBeNull()
})

test('find_contradiction names the tightest bounds', () => {
	const found = find_contradiction(
		get_feature_bounds(
			parse_prelude('media', '(min-width: 100px) and (min-width: 800px) and (max-width: 400px)'),
		),
	)
	expect([found?.lower.value, found?.upper.value]).toEqual([800, 400])
})

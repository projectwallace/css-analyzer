import { test, expect, describe } from 'vitest'
import { createPipeline, uniqueColors, declarationsPerRule } from './index.js'
import type { CountResultWithLocations, NumericResultWithLocations } from './index.js'

const CSS = `
:root { --brand: #f0f; }

.hero {
	color: red;
	background: rgb(0 0 0 / 0.5);
	border: 1px solid #000;
}

.card {
	color: red;
	background: linear-gradient(to right, #fff, blue);
	font-family: Black, sans-serif;
}

@media (min-width: 600px) {
	.hero {
		color: rebeccapurple;
	}
}
`

describe('v2 pipeline — without locations', () => {
	const result = createPipeline({
		colors: uniqueColors(),
		decls: declarationsPerRule(),
	}).run(CSS)

	test('colors: counts every color occurrence across the whole stylesheet', () => {
		// 8 occurrences: #f0f, red, rgb(...), #000, red, #fff, blue, rebeccapurple
		expect(result.colors.total).toBe(8)
		// 7 unique (red appears twice)
		expect(result.colors.totalUnique).toBe(7)
	})

	test('colors: red is counted twice (.hero and .card)', () => {
		expect(result.colors.unique['red']).toBe(2)
	})

	test('colors: "Black" inside font-family is NOT counted as a color', () => {
		expect(result.colors.unique['black']).toBeUndefined()
	})

	test('colors: blue inside linear-gradient IS counted', () => {
		expect(result.colors.unique['blue']).toBe(1)
	})

	test('colors: hex values are lowercased', () => {
		expect(result.colors.unique['#fff']).toBe(1)
		expect(result.colors.unique['#000']).toBe(1)
		expect(result.colors.unique['#f0f']).toBe(1)
	})

	test('decls: one entry per style rule', () => {
		// :root (1), .hero (3), .card (3), .hero inside @media (1) = 4 rules
		expect(result.decls.total).toBe(4)
		expect(result.decls.sum).toBe(8)
		expect(result.decls.items).toEqual([1, 3, 3, 1])
	})

	test('decls: no locations in result by default', () => {
		expect('itemsWithLocations' in result.decls).toBe(false)
	})

	test('colors: no locations in result by default', () => {
		expect('uniqueWithLocations' in result.colors).toBe(false)
	})
})

describe('v2 pipeline — with locations', () => {
	const result = createPipeline({
		colors: uniqueColors({ locations: true }),
		decls: declarationsPerRule({ locations: true }),
	}).run(CSS)

	test('colors: each unique color has one Location per occurrence', () => {
		const colors = result.colors as CountResultWithLocations
		expect(colors.uniqueWithLocations['red']).toHaveLength(2)
		expect(colors.uniqueWithLocations['blue']).toHaveLength(1)
		expect(colors.uniqueWithLocations['#000']).toHaveLength(1)
	})

	test('colors: location objects have line/column/offset/length', () => {
		const colors = result.colors as CountResultWithLocations
		const loc = colors.uniqueWithLocations['red']![0]!
		expect(loc.line).toBeGreaterThan(0)
		expect(loc.column).toBeGreaterThan(0)
		expect(loc.offset).toBeGreaterThanOrEqual(0)
		expect(loc.length).toBeGreaterThan(0)
		// Verify the offset+length actually point at "red"
		expect(CSS.slice(loc.offset, loc.offset + loc.length)).toBe('red')
	})

	test('decls: items array order matches itemsWithLocations order', () => {
		const decls = result.decls as NumericResultWithLocations
		expect(decls.itemsWithLocations.map((x) => x.value)).toEqual(decls.items)
	})

	test('decls: each item points at the originating rule', () => {
		const decls = result.decls as NumericResultWithLocations
		const first = decls.itemsWithLocations[0]!
		// First rule is :root with 1 declaration
		expect(first.value).toBe(1)
		expect(CSS.slice(first.location.offset, first.location.offset + first.location.length)).toMatch(
			/^:root\s*\{[^}]*\}/,
		)
	})
})

describe('v2 pipeline — tree-shaking shape', () => {
	test('can run with just colors, no declarations analyzer', () => {
		const result = createPipeline({ colors: uniqueColors() }).run('a { color: red }')
		expect(result.colors.total).toBe(1)
		// @ts-expect-error — decls was not requested
		expect(result.decls).toBeUndefined()
	})

	test('can run with just declarationsPerRule, no colors analyzer', () => {
		const result = createPipeline({ d: declarationsPerRule() }).run('a { color: red; font-size: 12px }')
		expect(result.d.items).toEqual([2])
	})
})

import { test, expect, describe } from 'vitest'
import {
	createPipeline,
	uniqueColors,
	declarationsPerRule,
	linesOfCode,
	uniqueMediaFeatures,
	embeddedContent,
} from './index.js'
import type {
	CountResultWithLocations,
	NumericResultWithLocations,
	EmbeddedContentResultWithLocations,
} from './index.js'

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

// ─── linesOfCode ────────────────────────────────────────────────────────────

describe('linesOfCode', () => {
	test('counts newline-terminated lines', () => {
		const r = createPipeline({ loc: linesOfCode() }).run('a {\n  color: red;\n}\n')
		expect(r.loc.total).toBe(4)
	})

	test('counts a single line with no newline', () => {
		const r = createPipeline({ loc: linesOfCode() }).run('a { color: red }')
		expect(r.loc.total).toBe(1)
	})

	test('empty string is 1 line', () => {
		const r = createPipeline({ loc: linesOfCode() }).run('')
		expect(r.loc.total).toBe(1)
	})

	test('counts correctly on the shared CSS fixture', () => {
		const r = createPipeline({ loc: linesOfCode() }).run(CSS)
		// CSS fixture has 22 lines (count \n occurrences + 1)
		expect(r.loc.total).toBe(CSS.split('\n').length)
	})
})

// ─── uniqueMediaFeatures ─────────────────────────────────────────────────────

const MEDIA_CSS = `
@media (min-width: 600px) { .a { color: red } }
@media (max-width: 1200px) and (min-width: 400px) { .b { color: blue } }
@media (hover: hover) { .c { color: green } }
@media (min-width: 900px) { .d { color: pink } }
`

describe('uniqueMediaFeatures — without locations', () => {
	const r = createPipeline({ mf: uniqueMediaFeatures() }).run(MEDIA_CSS)

	test('counts total feature occurrences', () => {
		// min-width (×3), max-width (×1), hover (×1)
		expect(r.mf.total).toBe(5)
	})

	test('counts unique feature names', () => {
		expect(r.mf.totalUnique).toBe(3)
	})

	test('min-width appears 3 times', () => {
		expect(r.mf.unique['min-width']).toBe(3)
	})

	test('feature names are lowercased', () => {
		expect(r.mf.unique['hover']).toBe(1)
		expect(r.mf.unique['max-width']).toBe(1)
	})
})

describe('uniqueMediaFeatures — with locations', () => {
	const r = createPipeline({ mf: uniqueMediaFeatures({ locations: true }) }).run(MEDIA_CSS)

	test('min-width has 3 location entries', () => {
		const mf = r.mf as CountResultWithLocations
		expect(mf.uniqueWithLocations['min-width']).toHaveLength(3)
	})

	test('locations have valid line/column/offset/length', () => {
		const mf = r.mf as CountResultWithLocations
		const loc = mf.uniqueWithLocations['hover']![0]!
		expect(loc.line).toBeGreaterThan(0)
		expect(loc.offset).toBeGreaterThanOrEqual(0)
		expect(loc.length).toBeGreaterThan(0)
	})
})

// ─── embeddedContent ─────────────────────────────────────────────────────────

const GIF_DATA = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
const SVG_DATA = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22/%3E'

const EMBED_CSS = `
.a { background: url("${GIF_DATA}") }
.b { background: url('${SVG_DATA}') }
.c { background: url("${GIF_DATA}") }
.d { background: url(https://example.com/img.png) }
`

describe('embeddedContent — without locations', () => {
	const r = createPipeline({ ec: embeddedContent() }).run(EMBED_CSS)

	test('counts only data URIs, not regular URLs', () => {
		expect(r.ec.totalCount).toBe(3)
	})

	test('accumulates total byte size of all data URIs', () => {
		expect(r.ec.totalSize).toBe(GIF_DATA.length * 2 + SVG_DATA.length)
	})

	test('sizeRatio is totalSize / css.length', () => {
		expect(r.ec.sizeRatio).toBeCloseTo(r.ec.totalSize / EMBED_CSS.length)
	})

	test('groups by MIME type', () => {
		expect(r.ec.unique['image/gif']!.count).toBe(2)
		expect(r.ec.unique['image/svg+xml']!.count).toBe(1)
	})

	test('per-type size is cumulative', () => {
		expect(r.ec.unique['image/gif']!.size).toBe(GIF_DATA.length * 2)
	})

	test('no locations field without option', () => {
		expect('locations' in (r.ec.unique['image/gif'] ?? {})).toBe(false)
	})
})

describe('embeddedContent — with locations', () => {
	const r = createPipeline({ ec: embeddedContent({ locations: true }) }).run(EMBED_CSS)

	test('each MIME type has one location per occurrence', () => {
		const ec = r.ec as EmbeddedContentResultWithLocations
		expect(ec.unique['image/gif']!.locations).toHaveLength(2)
		expect(ec.unique['image/svg+xml']!.locations).toHaveLength(1)
	})

	test('location offset points at the url() token', () => {
		const ec = r.ec as EmbeddedContentResultWithLocations
		const loc = ec.unique['image/svg+xml']!.locations[0]!
		expect(EMBED_CSS.slice(loc.offset, loc.offset + loc.length)).toMatch(/^url\(/)
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

import { test, expect, describe } from 'vitest'
import {
	createPipeline,
	uniqueColors,
	declarationsPerRule,
	linesOfCode,
	uniqueMediaFeatures,
	embeddedContent,
	stylesheetMeta,
	sourceLinesOfCode,
	atruleImports,
	atruleCharsets,
	atruleLayers,
	atruleFontFaces,
	atruleKeyframes,
	atruleMedia,
	atruleSupports,
	atruleContainers,
	atruleMisc,
	rules,
	selectors,
	declarations,
	properties,
	gradients,
	fontFamilies,
	fontSizes,
	lineHeights,
	zIndexes,
	shadows,
	borderRadii,
	animations,
	units,
	keywords,
	resets,
	displays,
	colorFormats,
	vendorPrefixedValues,
	valueBrowserhacks,
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

// ─── stylesheetMeta ─────────────────────────────────────────────────────────

describe('stylesheetMeta', () => {
	test('reports byte size', () => {
		const css = 'a { color: red }'
		const r = createPipeline({ m: stylesheetMeta() }).run(css)
		expect(r.m.size).toBe(css.length)
	})

	test('counts comments and their byte size', () => {
		const r = createPipeline({ m: stylesheetMeta() }).run('/* hello */ a { color: red } /* world */')
		expect(r.m.comments.total).toBe(2)
		expect(r.m.comments.size).toBe('/* hello */'.length + ' /* world */'.length - 1) // both comments
	})

	test('zero comments on comment-free css', () => {
		const r = createPipeline({ m: stylesheetMeta() }).run('a { color: red }')
		expect(r.m.comments.total).toBe(0)
		expect(r.m.comments.size).toBe(0)
	})
})

// ─── sourceLinesOfCode ───────────────────────────────────────────────────────

describe('sourceLinesOfCode', () => {
	test('counts atrules + selectors + declarations', () => {
		const css = '@media (min-width: 600px) { .a { color: red; font-size: 12px } }'
		const r = createPipeline({ sloc: sourceLinesOfCode() }).run(css)
		// 1 @media + 1 selector + 2 declarations = 4
		expect(r.sloc.total).toBe(4)
	})
})

// ─── at-rule analyzers ───────────────────────────────────────────────────────

describe('atruleImports', () => {
	test('counts @import rules', () => {
		const r = createPipeline({ a: atruleImports() }).run('@import "a.css"; @import "b.css";')
		expect(r.a.total).toBe(2)
		expect(r.a.unique['"a.css"']).toBe(1)
	})
})

describe('atruleCharsets', () => {
	test('counts @charset', () => {
		const r = createPipeline({ a: atruleCharsets() }).run('@charset "utf-8";')
		expect(r.a.total).toBe(1)
		expect(r.a.unique['"utf-8"']).toBe(1)
	})
})

describe('atruleLayers', () => {
	test('counts named layers', () => {
		const r = createPipeline({ a: atruleLayers() }).run('@layer base, theme; @layer utilities {}')
		expect(r.a.total).toBe(3)
	})

	test('anonymous layers get <anonymous> key', () => {
		const r = createPipeline({ a: atruleLayers() }).run('@layer {}')
		expect(r.a.unique['<anonymous>']).toBe(1)
	})
})

describe('atruleFontFaces', () => {
	const css = `
		@font-face { font-family: "MyFont"; src: url("myfont.woff2") }
		@font-face { font-family: "OtherFont"; src: url("other.woff2") }
	`
	test('counts each @font-face block', () => {
		const r = createPipeline({ a: atruleFontFaces() }).run(css)
		expect(r.a.total).toBe(2)
	})
	test('extracts descriptors', () => {
		const r = createPipeline({ a: atruleFontFaces() }).run(css)
		expect(r.a.unique[0]!['font-family']).toBe('"MyFont"')
	})
})

describe('atruleKeyframes', () => {
	test('counts @keyframes by name', () => {
		const r = createPipeline({ a: atruleKeyframes() }).run('@keyframes spin {} @keyframes fade {}')
		expect(r.a.total).toBe(2)
		expect(r.a.unique['spin']).toBe(1)
	})

	test('prefixed @keyframes tracked separately', () => {
		const r = createPipeline({ a: atruleKeyframes() }).run('@keyframes foo {} @-webkit-keyframes foo {}')
		expect(r.a.prefixed.total).toBe(1)
		expect(r.a.prefixedRatio).toBe(0.5)
	})
})

describe('atruleMedia', () => {
	test('counts @media queries', () => {
		const r = createPipeline({ a: atruleMedia() }).run('@media (min-width: 600px) {} @media print {}')
		expect(r.a.queries.total).toBe(2)
	})
})

describe('atruleSupports', () => {
	test('counts @supports queries', () => {
		const r = createPipeline({ a: atruleSupports() }).run('@supports (display: grid) {}')
		expect(r.a.queries.total).toBe(1)
	})
})

describe('atruleContainers', () => {
	test('counts @container queries', () => {
		const r = createPipeline({ a: atruleContainers() }).run('@container sidebar (min-width: 300px) {}')
		expect(r.a.queries.total).toBe(1)
		expect(r.a.names.unique['sidebar']).toBe(1)
	})
})

describe('atruleMisc', () => {
	test('tracks nesting depth of atrules', () => {
		const r = createPipeline({ a: atruleMisc() }).run('@media screen { @supports (display: grid) {} }')
		expect(r.a.nesting.total).toBe(2)
		expect(r.a.nesting.min).toBe(0)
		expect(r.a.nesting.max).toBe(1)
	})

	test('counts @property', () => {
		const r = createPipeline({ a: atruleMisc() }).run('@property --my-color { syntax: "<color>" }')
		expect(r.a.registeredProperties.total).toBe(1)
	})
})

// ─── rules ───────────────────────────────────────────────────────────────────

const RULES_CSS = `
.a { color: red; font-size: 12px }
.b.c { margin: 0 }
.empty {}
@media screen { .d { padding: 4px } }
`

describe('rules', () => {
	const r = createPipeline({ r: rules() }).run(RULES_CSS)

	test('counts total non-keyframe rules', () => {
		expect(r.r.total).toBe(4)
	})

	test('detects empty rules', () => {
		expect(r.r.empty.total).toBe(1)
		expect(r.r.empty.ratio).toBeCloseTo(1 / 4)
	})

	test('tracks selectors per rule distribution', () => {
		// .a → 1, .b.c → 1, .empty → 1, .d → 1
		expect(r.r.selectorsPerRule.max).toBe(1)
		expect(r.r.selectorsPerRule.sum).toBe(4)
	})

	test('nesting: @media child rule has depth > 0', () => {
		expect(r.r.nesting.max).toBeGreaterThan(0)
	})
})

// ─── selectors ───────────────────────────────────────────────────────────────

const SELECTORS_CSS = `
#id .class { color: red }
a:hover { color: blue }
.a, .b { color: green }
[data-active] { color: pink }
my-element { color: orange }
`

describe('selectors', () => {
	const r = createPipeline({ s: selectors() }).run(SELECTORS_CSS)

	test('counts total selectors', () => {
		// #id .class, a:hover, .a, .b, [data-active], my-element = 6
		expect(r.s.total).toBe(6)
	})

	test('specificity stats are computed', () => {
		expect(r.s.specificity.max).toHaveLength(3)
		expect(r.s.specificity.min).toHaveLength(3)
		// #id → [1,1,0], so max.a should be 1
		expect(r.s.specificity.max[0]).toBe(1)
	})

	test('tracks id selectors', () => {
		expect(r.s.id.total).toBe(1)
	})

	test('tracks pseudo-classes', () => {
		expect(r.s.pseudoClasses.unique['hover']).toBe(1)
	})

	test('tracks attribute selectors', () => {
		expect(r.s.attributes.unique['data-active']).toBe(1)
	})

	test('tracks custom elements', () => {
		expect(r.s.customElements.unique['my-element']).toBe(1)
	})

	test('keyframe selectors excluded from regular count', () => {
		const css = '@keyframes spin { from {} to {} } .a { color: red }'
		const r2 = createPipeline({ s: selectors() }).run(css)
		expect(r2.s.total).toBe(1)
		expect(r2.s.keyframes.total).toBe(2)
	})
})

// ─── declarations ────────────────────────────────────────────────────────────

describe('declarations', () => {
	const css = '.a { color: red !important; font-size: 12px } @keyframes x { from { opacity: 1 !important } }'
	const r = createPipeline({ d: declarations() }).run(css)

	test('counts all declarations', () => {
		expect(r.d.total).toBe(3)
	})

	test('counts !important declarations', () => {
		expect(r.d.importants.total).toBe(2)
	})

	test('tracks !important inside @keyframes separately', () => {
		expect(r.d.importants.inKeyframes.total).toBe(1)
	})
})

// ─── properties ──────────────────────────────────────────────────────────────

describe('properties', () => {
	const css = '.a { color: red; -webkit-transform: rotate(45deg); --my-var: 1; margin: 0 }'
	const r = createPipeline({ p: properties() }).run(css)

	test('counts total properties', () => {
		expect(r.p.total).toBe(4)
	})

	test('counts vendor-prefixed properties', () => {
		expect(r.p.prefixed.total).toBe(1)
	})

	test('counts custom properties', () => {
		expect(r.p.custom.total).toBe(1)
	})

	test('counts shorthand properties', () => {
		// margin is a shorthand
		expect(r.p.shorthands.total).toBe(1)
	})
})

// ─── value analyzers ─────────────────────────────────────────────────────────

describe('gradients', () => {
	test('counts gradient functions', () => {
		const r = createPipeline({ g: gradients() }).run('.a { background: linear-gradient(red, blue) }')
		expect(r.g.total).toBe(1)
	})
})

describe('fontFamilies', () => {
	test('extracts font-family values', () => {
		const r = createPipeline({ f: fontFamilies() }).run('.a { font-family: Arial, sans-serif }')
		expect(r.f.total).toBe(1)
	})

	test('extracts from font shorthand', () => {
		const r = createPipeline({ f: fontFamilies() }).run('.a { font: 12px "Helvetica" }')
		expect(r.f.total).toBe(1)
	})
})

describe('fontSizes', () => {
	test('extracts font-size values', () => {
		const r = createPipeline({ f: fontSizes() }).run('.a { font-size: 16px } .b { font-size: 1rem }')
		expect(r.f.totalUnique).toBe(2)
	})
})

describe('lineHeights', () => {
	test('extracts line-height values', () => {
		const r = createPipeline({ f: lineHeights() }).run('.a { line-height: 1.5 } .b { line-height: 24px }')
		expect(r.f.totalUnique).toBe(2)
	})
})

describe('zIndexes', () => {
	test('extracts z-index values', () => {
		const r = createPipeline({ z: zIndexes() }).run('.a { z-index: 10 } .b { z-index: 100 } .c { z-index: 10 }')
		expect(r.z.total).toBe(3)
		expect(r.z.totalUnique).toBe(2)
	})
})

describe('shadows', () => {
	test('tracks text-shadow and box-shadow separately', () => {
		const r = createPipeline({ s: shadows() }).run(
			'.a { text-shadow: 1px 1px black; box-shadow: 0 2px 4px red }',
		)
		expect(r.s.textShadows.total).toBe(1)
		expect(r.s.boxShadows.total).toBe(1)
	})
})

describe('borderRadii', () => {
	test('extracts border-radius values with property context', () => {
		const r = createPipeline({ b: borderRadii() }).run(
			'.a { border-radius: 4px; border-top-left-radius: 2px }',
		)
		expect(r.b.total).toBe(2)
		expect(Object.keys(r.b.itemsPerContext)).toContain('border-radius')
	})
})

describe('animations', () => {
	test('extracts durations from animation shorthand', () => {
		const r = createPipeline({ a: animations() }).run('.a { animation: spin 1s ease-in-out }')
		expect(r.a.durations.total).toBe(1)
		expect(r.a.durations.unique['1s']).toBe(1)
	})

	test('extracts timing functions', () => {
		const r = createPipeline({ a: animations() }).run('.a { animation: spin 1s ease-in-out }')
		expect(r.a.timingFunctions.unique['ease-in-out']).toBe(1)
	})
})

describe('units', () => {
	test('extracts units with property context', () => {
		const r = createPipeline({ u: units() }).run('.a { font-size: 16px; margin: 1rem; width: 100% }')
		expect(r.u.unique['px']).toBe(1)
		expect(r.u.unique['rem']).toBe(1)
		expect(Object.keys(r.u.itemsPerContext)).toContain('font-size')
	})
})

describe('keywords', () => {
	test('tracks CSS keywords like auto/none/inherit', () => {
		const r = createPipeline({ k: keywords() }).run('.a { display: none } .b { overflow: auto }')
		expect(r.k.unique['none']).toBe(1)
		expect(r.k.unique['auto']).toBe(1)
	})
})

describe('resets', () => {
	test('tracks spacing properties set to zero', () => {
		const r = createPipeline({ rs: resets() }).run('.a { margin: 0; padding: 0 }')
		expect(r.rs.total).toBe(2)
		expect(r.rs.unique['margin']).toBe(1)
	})
})

describe('displays', () => {
	test('tracks display property values', () => {
		const r = createPipeline({ d: displays() }).run('.a { display: flex } .b { display: grid } .c { display: flex }')
		expect(r.d.total).toBe(3)
		expect(r.d.unique['flex']).toBe(2)
	})
})

describe('colorFormats', () => {
	test('distinguishes hex vs named vs function colors', () => {
		const r = createPipeline({ cf: colorFormats() }).run(
			'.a { color: #f00; background: red; border-color: rgb(0 0 255) }',
		)
		expect(r.cf.unique['hex3']).toBe(1)
		expect(r.cf.unique['named']).toBe(1)
		expect(r.cf.unique['rgb']).toBe(1)
	})
})

describe('vendorPrefixedValues', () => {
	test('detects vendor-prefixed values', () => {
		const r = createPipeline({ vp: vendorPrefixedValues() }).run(
			'.a { display: -webkit-flex }',
		)
		expect(r.vp.total).toBeGreaterThan(0)
	})
})

describe('valueBrowserhacks', () => {
	test('detects progid: IE filter hack', () => {
		const css =
			'.a { filter: progid:DXImageTransform.Microsoft.gradient(startColorstr="#f00", endColorstr="#00f") }'
		const r = createPipeline({ bh: valueBrowserhacks() }).run(css)
		expect(r.bh.total).toBeGreaterThan(0)
		expect(r.bh.unique['progid:']).toBeGreaterThan(0)
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

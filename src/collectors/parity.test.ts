import { test, expect, describe } from 'vitest'
import { analyze as analyze_legacy } from '../index.js'
import { analyze } from '../engine/analyzer.js'
import { stylesheet_fixture as fixture } from '../test-fixture.js'
import { basename } from '../properties/property-utils.js'
import { summarize_numbers } from '../engine/summary.js'
import type { CountResult } from '../engine/types.js'
import {
	animation_names,
	atrules,
	declarations,
	displays,
	keywords,
	properties,
	resets,
	rules,
	selectors,
	stylesheet,
	text_shadows,
	units,
	value_browserhacks,
	value_complexity,
	value_prefixes,
	z_indexes,
} from './index.js'

function counts(result: CountResult): Record<string, number> {
	return Object.fromEntries([...result.unique].map(([item, { count }]) => [item, count]))
}

function fold_by_basename(
	contexts: Record<string, { unique: Record<string, number> }>,
): Record<string, Record<string, number>> {
	const folded: Record<string, Record<string, number>> = {}
	for (const [property, context] of Object.entries(contexts)) {
		const target = (folded[basename(property)] ??= {})
		for (const [item, count] of Object.entries(context.unique)) {
			target[item] = (target[item] ?? 0) + count
		}
	}
	return folded
}

type Aggregate = {
	min: number
	max: number
	mean: number
	mode: number
	range: number
	sum: number
}

/** Legacy aggregates are min/max/mean/mode/range/sum; ours add total and median */
function aggregate(result: CountResult): Aggregate {
	const { min, max, mean, mode, range, sum } = summarize_numbers(result)
	return { min, max, mean, mode, range, sum }
}

function pick(legacy: Aggregate): Aggregate {
	const { min, max, mean, mode, range, sum } = legacy
	return { min, max, mean, mode, range, sum }
}

function defined_used(result: {
	defined: string[]
	used: string[]
	unused: string[]
	unknown: string[]
}) {
	return {
		defined: result.defined,
		used: result.used,
		unused: result.unused,
		unknown: result.unknown,
	}
}

describe('parity of all remaining 9.x metrics', () => {
	const legacy = analyze_legacy(fixture)
	const result = analyze(fixture, {
		stylesheet: stylesheet(),
		atrules: atrules(),
		rules: rules(),
		selectors: selectors(),
		declarations: declarations(),
		properties: properties(),
		text_shadows: text_shadows(),
		z_indexes: z_indexes(),
		displays: displays(),
		animation_names: animation_names(),
		value_prefixes: value_prefixes(),
		value_browserhacks: value_browserhacks(),
		value_complexity: value_complexity(),
		units: units({ contexts: true }),
		keywords: keywords(),
		resets: resets(),
	})

	test('stylesheet', () => {
		const sheet = legacy.stylesheet
		expect(result.stylesheet.size).toBe(sheet.size)
		expect(result.stylesheet.lines).toBe(sheet.linesOfCode)
		expect(result.stylesheet.comments).toEqual(sheet.comments)
		expect(result.stylesheet.embedded.size).toBe(sheet.embeddedContent.size.total)
		expect(result.stylesheet.embedded.total).toBe(sheet.embeddedContent.types.total)
		expect(
			Object.fromEntries(
				[...result.stylesheet.embedded.types].map(([type, e]) => [
					type,
					{ count: e.count, size: e.size },
				]),
			),
		).toEqual(sheet.embeddedContent.types.unique)
	})

	describe('atrules', () => {
		const expected = legacy.atrules
		const actual = result.atrules

		test('names', () => expect(counts(actual)).toEqual(expected.unique))
		test('font faces', () => {
			expect(actual.font_faces.total).toBe(expected.fontface.total)
			expect(actual.font_faces.items).toEqual(expected.fontface.unique)
		})
		test('import, charset, scope, property, function', () => {
			expect(counts(actual.imports)).toEqual(expected.import.unique)
			expect(counts(actual.charsets)).toEqual(expected.charset.unique)
			expect(counts(actual.scopes)).toEqual(expected.scope.unique)
			expect(counts(actual.properties)).toEqual(expected.property.unique)
			expect(counts(actual.functions)).toEqual(expected.function.unique)
		})
		test('media', () => {
			expect(counts(actual.media)).toEqual(expected.media.unique)
			expect(counts(actual.media.browserhacks)).toEqual(expected.media.browserhacks.unique)
			expect(counts(actual.media.features)).toEqual(expected.media.features.unique)
		})
		test('supports', () => {
			expect(counts(actual.supports)).toEqual(expected.supports.unique)
			expect(counts(actual.supports.browserhacks)).toEqual(expected.supports.browserhacks.unique)
		})
		test('keyframes', () => {
			expect(counts(actual.keyframes)).toEqual(expected.keyframes.unique)
			expect(counts(actual.keyframes.prefixed)).toEqual(expected.keyframes.prefixed.unique)
			expect(defined_used(actual.keyframes)).toEqual(defined_used(expected.keyframes))
		})
		test('container', () => {
			expect(counts(actual.containers)).toEqual(expected.container.unique)
			expect(counts(actual.containers.names)).toEqual(expected.container.names.unique)
			expect(defined_used(actual.containers.names)).toEqual(defined_used(expected.container.names))
		})
		test('layer', () => {
			expect(counts(actual.layers)).toEqual(expected.layer.unique)
			expect(defined_used(actual.layers)).toEqual(defined_used(expected.layer))
		})
		test('complexity and nesting', () => {
			expect(aggregate(actual.complexity)).toEqual(pick(expected.complexity))
			expect(aggregate(actual.nesting)).toEqual(pick(expected.nesting))
			expect(counts(actual.nesting)).toEqual(expected.nesting.unique)
		})
	})

	describe('rules', () => {
		const expected = legacy.rules
		const actual = result.rules
		test('totals', () => {
			expect(actual.total).toBe(expected.total)
			expect(actual.empty).toBe(expected.empty.total)
		})
		test('sizes, nesting, selectors, declarations', () => {
			for (const key of ['sizes', 'nesting', 'selectors', 'declarations'] as const) {
				expect(aggregate(actual[key])).toEqual(pick(expected[key]))
				expect(counts(actual[key])).toEqual(expected[key].unique)
			}
		})
	})

	describe('selectors', () => {
		const expected = legacy.selectors
		const actual = result.selectors
		test('totals and complexity', () => {
			expect(actual.total).toBe(expected.total)
			expect(actual.total_unique).toBe(expected.totalUnique)
			expect(aggregate(actual.complexity)).toEqual(pick(expected.complexity))
			expect(counts(actual.complexity)).toEqual(expected.complexity.unique)
			expect(aggregate(actual.nesting)).toEqual(pick(expected.nesting))
		})
		test('kinds', () => {
			expect(counts(actual.ids)).toEqual(expected.id.unique)
			expect(counts(actual.pseudo_classes)).toEqual(expected.pseudoClasses.unique)
			expect(counts(actual.pseudo_elements)).toEqual(expected.pseudoElements.unique)
			expect(counts(actual.accessibility)).toEqual(expected.accessibility.unique)
			expect(counts(actual.attributes)).toEqual(expected.attributes.unique)
			expect(counts(actual.custom_elements)).toEqual(expected.customElements.unique)
			expect(counts(actual.keyframes)).toEqual(expected.keyframes.unique)
			expect(counts(actual.prefixed)).toEqual(expected.prefixed.unique)
			expect(counts(actual.combinators)).toEqual(expected.combinators.unique)
		})
	})

	test('declarations', () => {
		const expected = legacy.declarations
		const actual = result.declarations
		expect(actual.total).toBe(expected.total)
		expect(actual.total_unique).toBe(expected.totalUnique)
		expect(actual.importants.total).toBe(expected.importants.total)
		expect(actual.importants.in_keyframes).toBe(expected.importants.inKeyframes.total)
		expect(aggregate(actual.complexity)).toEqual(pick(expected.complexity))
		expect(aggregate(actual.nesting)).toEqual(pick(expected.nesting))
	})

	describe('properties', () => {
		const expected = legacy.properties
		const actual = result.properties
		test('names, prefixed, shorthands, hacks', () => {
			expect(counts(actual)).toEqual(expected.unique)
			expect(counts(actual.prefixed)).toEqual(expected.prefixed.unique)
			expect(counts(actual.shorthands)).toEqual(expected.shorthands.unique)
			expect(counts(actual.browserhacks)).toEqual(expected.browserhacks.unique)
			expect(aggregate(actual.complexity)).toEqual(pick(expected.complexity))
		})
		test('custom properties', () => {
			expect(counts(actual.custom)).toEqual(expected.custom.unique)
			expect(counts(actual.custom.importants)).toEqual(expected.custom.importants.unique)
			expect(defined_used(actual.custom)).toEqual(defined_used(expected.custom))
		})
		test('anchor names', () => {
			expect(defined_used(actual.anchor_names)).toEqual(defined_used(expected.anchorNames))
		})
	})

	describe('values', () => {
		const expected = legacy.values
		test('simple counts', () => {
			expect(counts(result.text_shadows)).toEqual(expected.textShadows.unique)
			expect(counts(result.z_indexes)).toEqual(expected.zindexes.unique)
			expect(counts(result.displays)).toEqual(expected.displays.unique)
			expect(counts(result.animation_names)).toEqual(expected.animations.names.unique)
			expect(counts(result.value_prefixes)).toEqual(expected.prefixes.unique)
			expect(counts(result.value_browserhacks)).toEqual(expected.browserhacks.unique)
			expect(counts(result.keywords)).toEqual(expected.keywords.unique)
			expect(counts(result.resets)).toEqual(expected.resets.unique)
		})
		test('complexity', () => {
			expect(aggregate(result.value_complexity)).toEqual(pick(expected.complexity))
		})
		test('units (contexts use the normalized property, so `_height` is `height`)', () => {
			expect(counts(result.units)).toEqual(expected.units.unique)
			const folded = fold_by_basename(expected.units.itemsPerContext)
			expect(
				Object.fromEntries(
					[...result.units.by_context].map(([property, context]) => [property, counts(context)]),
				),
			).toEqual(folded)
		})
	})
})

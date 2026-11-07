import { test, expect } from 'vitest'
import { analyze, create_analyzer, merge } from '../engine/analyzer.js'
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
	specificity,
	stylesheet,
	text_shadows,
	units,
	value_browserhacks,
	value_complexity,
	value_prefixes,
	z_indexes,
} from './index.js'

function collectors() {
	const options = { locations: true }
	return {
		stylesheet: stylesheet(options),
		atrules: atrules(options),
		rules: rules(options),
		selectors: selectors(options),
		specificity: specificity(options),
		declarations: declarations(options),
		properties: properties(options),
		text_shadows: text_shadows(options),
		z_indexes: z_indexes(options),
		displays: displays(options),
		animation_names: animation_names(options),
		value_prefixes: value_prefixes(options),
		value_browserhacks: value_browserhacks(options),
		value_complexity: value_complexity(options),
		units: units({ ...options, contexts: true }),
		keywords: keywords(options),
		resets: resets(options),
	}
}

const a = `
/* one */
@import url(a.css) layer(base);
@keyframes spin { to { opacity: 1 } }
@font-face { font-family: A; src: url(data:font/woff2;base64,AA) }
:root { --x: 1px; --y: 2px }
a { z-index: 1; margin: 0; color: var(--x); animation: spin 1s; display: flex !important }
`
const b = `
@layer base { b { z-index: 2; text-shadow: 0 0 1px red } }
@keyframes fade { to { opacity: 1 } }
@font-face { font-family: B; src: url(b.woff2) }
.c > .d { --z: 3px; width: 10px; animation: fade 1s; display: -webkit-box }
`

test('merging two runs equals adding both inputs to one analyzer', () => {
	const merged = merge(
		analyze(a, collectors(), { source: 'a.css' }),
		analyze(b, collectors(), { source: 'b.css' }),
	)
	const incremental = create_analyzer(collectors())
		.add(a, { source: 'a.css' })
		.add(b, { source: 'b.css' })
		.result()

	for (const key of Object.keys(incremental) as (keyof typeof incremental)[]) {
		expect({ [key]: merged[key] }).toEqual({ [key]: incremental[key] })
	}
})

test('defined and used names are combined across files', () => {
	const only_a = analyze('@keyframes spin { to { opacity: 1 } }', collectors())
	const only_b = analyze('a { animation: spin 1s; animation-name: other }', collectors())
	expect(only_a.atrules.keyframes.unused).toEqual(['spin'])
	expect(only_b.atrules.keyframes.unknown).toEqual(['spin', 'other'])

	const merged = merge(only_a, only_b)
	expect(merged.atrules.keyframes.defined).toEqual(['spin'])
	expect(merged.atrules.keyframes.unused).toEqual([])
	expect(merged.atrules.keyframes.unknown).toEqual(['other'])
})

test('every collector works with locations and a source', () => {
	const result = analyze(a, collectors(), { source: 'a.css' })
	expect(result.z_indexes.unique.get('1')?.locations?.[0]?.source).toBe('a.css')
	expect(result.rules.sizes.unique.size).toBeGreaterThan(0)
})

test('@supports conditions are not declarations', () => {
	const result = analyze('@supports (display: grid) { a { color: red } }', {
		declarations: declarations(),
		properties: properties(),
	})
	expect(result.declarations.total).toBe(1)
	expect([...result.properties.unique.keys()]).toEqual(['color'])
})

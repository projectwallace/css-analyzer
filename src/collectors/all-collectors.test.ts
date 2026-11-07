import { test, expect } from 'vitest'
import { analyze, create_analyzer } from '../engine/analyzer.js'
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

test('every collector works across several added inputs', () => {
	const analyzer = create_analyzer(collectors())
		.add(a, { source: 'a.css' })
		.add(b, { source: 'b.css' })
	const result = analyzer.result()

	expect(result.z_indexes.unique.get('1')?.locations?.[0]?.source).toBe('a.css')
	expect(result.z_indexes.unique.get('2')?.locations?.[0]?.source).toBe('b.css')
	expect(result.rules.total).toBe(4)
})

test('defined and used names are combined across added inputs', () => {
	const analyzer = create_analyzer(collectors())
	analyzer.add('@keyframes spin { to { opacity: 1 } }')
	expect(analyzer.result().atrules.keyframes.unused).toEqual(['spin'])

	analyzer.add('a { animation: spin 1s; animation-name: other }')
	const { keyframes } = analyzer.result().atrules
	expect(keyframes.defined).toEqual(['spin'])
	expect(keyframes.unused).toEqual([])
	expect(keyframes.unknown).toEqual(['other'])
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

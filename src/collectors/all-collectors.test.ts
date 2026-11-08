import { test, expect } from 'vitest'
import { analyze } from '../engine/analyzer.ts'
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
} from './index.ts'

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
:root { --x: 1px }
a { z-index: 1; margin: 0; color: var(--x); animation: spin 1s; display: flex !important }
`

test('every collector works with locations', () => {
	const result = analyze(a, collectors())
	expect(result.z_indexes.unique.get('1')?.locations?.[0]?.line).toBeGreaterThan(0)
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

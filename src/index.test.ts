import { test, expect, describe } from 'vitest'
import * as api from './index.ts'
import * as collectors from './collectors/index.ts'
import * as presets from './presets/index.ts'
import * as selectors from './selectors/index.ts'
import * as values from './values/index.ts'
import * as atrules from './atrules/index.ts'
import * as properties from './properties/index.ts'

describe('Public API', () => {
	test('main entry exports the engine', () => {
		expect(Object.keys(api).sort()).toEqual(
			[
				'DefinedUsed',
				'KeywordSet',
				'analyze',
				'create_context_counter',
				'create_counter',
				'define_collector',
				'summarize',
				'summarize_frequencies',
				'summarize_numbers',
			].sort(),
		)
	})

	test('collectors are factories that return a definition', () => {
		const factories = Object.entries(collectors).filter(
			([name]) => name !== 'summarize_specificity',
		)
		const definitions = factories.map(([, factory]) => (factory as () => { create: unknown })())
		expect(factories.length).toBeGreaterThan(20)
		expect(definitions.map((definition) => typeof definition.create)).toEqual(
			definitions.map(() => 'function'),
		)
	})

	test('presets', () => {
		expect(Object.keys(presets).sort()).toEqual(
			['all_collectors', 'analyze_all', 'analyze_design_tokens', 'design_tokens_collectors'].sort(),
		)
	})

	test('utility subpaths expose snake_case functions only', () => {
		for (const module of [selectors, values, atrules, properties]) {
			for (const name of Object.keys(module)) {
				expect(name).toMatch(/^[a-z][a-z0-9_]*$/)
			}
		}
	})

	test('exposes the keyword sets', () => {
		expect(values.named_colors.has('Red')).toBeTruthy()
		expect(values.system_colors.has('LinkText')).toBeTruthy()
		expect(values.color_functions.has('okLAB')).toBeTruthy()
		expect(values.color_keywords.has('TRANSPARENT')).toBeTruthy()
		expect(values.keywords.has('INHERIT')).toBeTruthy()
		expect(api.KeywordSet).toBeTypeOf('function')
	})

	test('exposes property helpers', () => {
		expect(properties.is_property_hack('*zoom')).toBe(true)
		expect(properties.basename('-webkit-Transition')).toBe('transition')
	})
})

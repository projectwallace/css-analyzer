import { test, expect, describe } from 'vitest'
import {
	analyze,
	compareSpecificity,
	selectorComplexity,
	isAccessibilitySelector,
	isSelectorPrefixed,
	isMediaBrowserhack,
	isSupportsBrowserhack,
	isPropertyHack,
	isValuePrefixed,
	hasVendorPrefix,
	cssKeywords,
	KeywordSet,
	// Color exports
	namedColors,
	systemColors,
	colorFunctions,
	colorKeywords,
	type UniqueWithLocations,
	type Location,
	type Specificity,
	type AnalysisPath,
} from './index.js'

describe('Public API', () => {
	test("exposes the 'analyze' method", () => {
		expect(typeof analyze).toBe('function')
	})

	test('exposes the "compareSpecificity" method', () => {
		expect(typeof compareSpecificity).toBe('function')
	})

	test('exposes the "selectorComplexity" method', () => {
		expect(typeof selectorComplexity).toBe('function')
	})

	test('exposes the "isSelectorPrefixed" method', () => {
		expect(typeof isSelectorPrefixed).toBe('function')
	})

	test('exposes the "isAccessibilitySelector" method', () => {
		expect(typeof isAccessibilitySelector).toBe('function')
	})

	test('exposes the "isMediaBrowserhack" method', () => {
		expect(typeof isMediaBrowserhack).toBe('function')
	})

	test('exposes the "isSupportsBrowserhack" method', () => {
		expect(typeof isSupportsBrowserhack).toBe('function')
	})

	test('exposes the "isPropertyHack" method', () => {
		expect(typeof isPropertyHack).toBe('function')
	})

	test('exposes the "isValuePrefixed" method', () => {
		expect(typeof isValuePrefixed).toBe('function')
	})

	test('exposes the "hasVendorPrefix" method', () => {
		expect(typeof hasVendorPrefix).toBe('function')
	})

	test('exposes the "compareSpecificity" method', () => {
		expect(typeof compareSpecificity).toBe('function')
	})

	test('exposes the namedColors KeywordSet', () => {
		expect(namedColors.has('Red')).toBeTruthy()
	})

	test('exposes the systemColors KeywordSet', () => {
		expect(systemColors.has('LinkText')).toBeTruthy()
	})

	test('exposes the colorFunctions KeywordSet', () => {
		expect(colorFunctions.has('okLAB')).toBeTruthy()
	})

	test('exposes the colorKeywords KeywordSet', () => {
		expect(colorKeywords.has('TRANSPARENT')).toBeTruthy()
	})

	test('exposes CSS keywords KeywordSet', () => {
		expect(cssKeywords.has('Auto')).toBeTruthy()
		expect(cssKeywords.has('inherit')).toBeTruthy()
	})

	test('exposes the KeywordSet class', () => {
		expect(typeof KeywordSet).toBe('function')
		expect(new KeywordSet([]).constructor.name).toBe('KeywordSet')
	})

	test('exposes Location type', () => {
		let location: Location = {
			offset: 0,
			line: 0,
			length: 0,
			column: 0,
		}
		expect(location).toHaveProperty('line')
	})

	test('exposes UniqueWithLocations type', () => {
		let location: Location = {
			offset: 0,
			line: 0,
			length: 0,
			column: 0,
		}
		let uniqueWithLocations: UniqueWithLocations = {
			'my-item': [location],
		}
		expect(uniqueWithLocations).toHaveProperty('my-item')
	})

	test('exposes Specificity type', () => {
		let specificity: Specificity = [1, 1, 1]
		expect(specificity).toHaveLength(3)
	})
})

test('does not break on CSS Syntax Errors', () => {
	expect(() => analyze('test, {}')).not.toThrow()
	expect(() => analyze('test { color red }')).not.toThrow()
})

test('handles empty input gracefully', () => {
	const actual = analyze('')
	// @ts-expect-error Just for testing purposes
	delete actual.__meta__
	const expected = {
		stylesheet: {
			sourceLinesOfCode: 0,
			linesOfCode: 1,
			size: 0,
			comments: {
				total: 0,
				size: 0,
			},
			embeddedContent: {
				size: {
					total: 0,
					ratio: 0,
				},
				types: {
					total: 0,
					totalUnique: 0,
					uniquenessRatio: 0,
					unique: {},
				},
			},
			complexity: 0,
		},
		atrules: {
			total: 0,
			totalUnique: 0,
			unique: {},
			uniquenessRatio: 0,
			fontface: {
				total: 0,
				totalUnique: 0,
				unique: [],
				uniquenessRatio: 0,
			},
			import: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
			},
			media: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
				browserhacks: {
					total: 0,
					totalUnique: 0,
					unique: {},
					uniquenessRatio: 0,
				},
				features: {
					total: 0,
					totalUnique: 0,
					unique: {},
					uniquenessRatio: 0,
				},
			},
			charset: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
			},
			supports: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
				browserhacks: {
					total: 0,
					totalUnique: 0,
					unique: {},
					uniquenessRatio: 0,
				},
			},
			keyframes: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
				prefixed: {
					total: 0,
					totalUnique: 0,
					unique: {},
					uniquenessRatio: 0,
					ratio: 0,
				},
			},
			container: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
				names: {
					total: 0,
					totalUnique: 0,
					unique: {},
					uniquenessRatio: 0,
				},
			},
			layer: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
			},
			property: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
			},
			function: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
			},
			scope: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
			},
			complexity: {
				min: 0,
				max: 0,
				mean: 0,
				mode: 0,
				range: 0,
				sum: 0,
			},
			nesting: {
				min: 0,
				max: 0,
				mean: 0,
				mode: 0,
				range: 0,
				sum: 0,
				items: [],
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
			},
		},
		rules: {
			total: 0,
			empty: {
				total: 0,
				ratio: 0,
			},
			sizes: {
				min: 0,
				max: 0,
				mean: 0,
				mode: 0,
				range: 0,
				sum: 0,
				items: [],
				unique: {},
				total: 0,
				totalUnique: 0,
				uniquenessRatio: 0,
			},
			nesting: {
				min: 0,
				max: 0,
				mean: 0,
				mode: 0,
				range: 0,
				sum: 0,
				items: [],
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
			},
			selectors: {
				min: 0,
				max: 0,
				mean: 0,
				mode: 0,
				range: 0,
				sum: 0,
				items: [],
				unique: {},
				total: 0,
				totalUnique: 0,
				uniquenessRatio: 0,
			},
			declarations: {
				min: 0,
				max: 0,
				mean: 0,
				mode: 0,
				range: 0,
				sum: 0,
				items: [],
				unique: {},
				total: 0,
				totalUnique: 0,
				uniquenessRatio: 0,
			},
		},
		selectors: {
			total: 0,
			totalUnique: 0,
			uniquenessRatio: 0,
			specificity: {
				min: [0, 0, 0],
				max: [0, 0, 0],
				sum: [0, 0, 0],
				mean: [0, 0, 0],
				mode: [0, 0, 0],
				items: [],
				unique: {},
				total: 0,
				totalUnique: 0,
				uniquenessRatio: 0,
			},
			complexity: {
				min: 0,
				max: 0,
				mean: 0,
				mode: 0,
				range: 0,
				sum: 0,
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
				items: [],
			},
			nesting: {
				min: 0,
				max: 0,
				mean: 0,
				mode: 0,
				range: 0,
				sum: 0,
				items: [],
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
			},
			id: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
				ratio: 0,
			},
			pseudoClasses: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
			},
			pseudoElements: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
			},
			accessibility: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
				ratio: 0,
			},
			attributes: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
			},
			customElements: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
			},
			keyframes: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
			},
			prefixed: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
				ratio: 0,
			},
			combinators: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
			},
		},
		declarations: {
			total: 0,
			totalUnique: 0,
			uniquenessRatio: 0,
			importants: {
				total: 0,
				ratio: 0,
				inKeyframes: {
					total: 0,
					ratio: 0,
				},
			},
			complexity: {
				min: 0,
				max: 0,
				mean: 0,
				mode: 0,
				range: 0,
				sum: 0,
			},
			nesting: {
				min: 0,
				max: 0,
				mean: 0,
				mode: 0,
				range: 0,
				sum: 0,
				items: [],
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
			},
		},
		properties: {
			total: 0,
			totalUnique: 0,
			unique: {},
			uniquenessRatio: 0,
			prefixed: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
				ratio: 0,
			},
			custom: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
				ratio: 0,
				importants: {
					total: 0,
					totalUnique: 0,
					unique: {},
					uniquenessRatio: 0,
					ratio: 0,
				},
			},
			shorthands: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
				ratio: 0,
			},
			browserhacks: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
				ratio: 0,
			},
			complexity: {
				min: 0,
				max: 0,
				mean: 0,
				mode: 0,
				range: 0,
				sum: 0,
			},
		},
		values: {
			colors: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
				itemsPerContext: {},
				formats: {
					total: 0,
					totalUnique: 0,
					unique: {},
					uniquenessRatio: 0,
				},
			},
			gradients: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
			},
			fontFamilies: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
			},
			fontSizes: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
			},
			lineHeights: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
			},
			zindexes: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
			},
			textShadows: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
			},
			boxShadows: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
			},
			borderRadiuses: {
				total: 0,
				totalUnique: 0,
				unique: {},
				itemsPerContext: {},
				uniquenessRatio: 0,
			},
			animations: {
				durations: {
					total: 0,
					totalUnique: 0,
					unique: {},
					uniquenessRatio: 0,
				},
				timingFunctions: {
					total: 0,
					totalUnique: 0,
					unique: {},
					uniquenessRatio: 0,
				},
			},
			prefixes: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
			},
			browserhacks: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
			},
			units: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
				itemsPerContext: {},
			},
			complexity: {
				min: 0,
				max: 0,
				mean: 0,
				mode: 0,
				range: 0,
				sum: 0,
			},
			keywords: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
			},
			resets: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
			},
			displays: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
			},
		},
	}

	expect(actual).toEqual(expected)
})

test('has metadata', () => {
	const fixture = Array.from({ length: 100 })
		.map(
			(_) => `
    html {
      font: 1em/1 sans-serif;
      color: rgb(0 0 0 / 0.5);
    }

    @media screen {
      @supports (display: grid) {
        test::after :where(test) :is(done) {
          display: grid;
          color: #f00;
        }
      }
    }
  `,
		)
		.join('')

	const result = analyze(fixture)
	const actual = result.__meta__

	expect(typeof actual.parseTime).toBe('number')
	expect(actual.parseTime).toBeGreaterThan(0)

	expect(typeof actual.analyzeTime).toBe('number')
	expect(actual.analyzeTime).toBeGreaterThan(0)

	expect(typeof actual.total).toBe('number')
	expect(actual.total).toBeGreaterThan(0)
})

describe('include/exclude options', () => {
	const CSS = `
		@media screen and (min-width: 600px) {
			.foo, #bar {
				color: red;
				font-size: 1rem;
				background: linear-gradient(to bottom, #fff, #000);
			}
		}
		@keyframes spin {
			from { transform: rotate(0deg) }
			to { transform: rotate(360deg) }
		}
	`

	test('no options returns full analysis', () => {
		const result = analyze(CSS)
		expect(result.atrules.total).toBeGreaterThan(0)
		expect(result.selectors.total).toBeGreaterThan(0)
		expect(result.declarations.total).toBeGreaterThan(0)
		expect(result.properties.total).toBeGreaterThan(0)
		expect(result.values.colors.total).toBeGreaterThan(0)
	})

	test('include: atrules returns atrules data and zeroes elsewhere', () => {
		const result = analyze(CSS, { include: ['atrules'] })
		expect(result.atrules.total).toBeGreaterThan(0)
		expect(result.atrules.media.total).toBeGreaterThan(0)
		expect(result.atrules.keyframes.total).toBeGreaterThan(0)
		// Excluded sections should be empty
		expect(result.selectors.total).toBe(0)
		expect(result.declarations.total).toBe(0)
		expect(result.rules.total).toBe(0)
	})

	test('include: selectors.complexity only collects selector complexity', () => {
		const result = analyze(CSS, { include: ['selectors.complexity'] })
		expect(result.selectors.complexity.total).toBeGreaterThan(0)
		// Other selector sub-features should be empty
		expect(result.selectors.specificity.total).toBe(0)
		expect(result.selectors.id.total).toBe(0)
		expect(result.selectors.pseudoClasses.total).toBe(0)
	})

	test('include: multiple paths collects all specified sections', () => {
		const result = analyze(CSS, { include: ['atrules', 'selectors.complexity'] })
		expect(result.atrules.total).toBeGreaterThan(0)
		expect(result.selectors.complexity.total).toBeGreaterThan(0)
		expect(result.declarations.total).toBe(0)
	})

	test('exclude: values skips value analysis', () => {
		const full = analyze(CSS)
		const result = analyze(CSS, { exclude: ['values'] })
		expect(result.values.colors.total).toBe(0)
		expect(result.values.fontSizes.total).toBe(0)
		// Other sections should still have data
		expect(result.atrules.total).toBe(full.atrules.total)
		expect(result.selectors.total).toBe(full.selectors.total)
		expect(result.declarations.total).toBe(full.declarations.total)
		expect(result.properties.total).toBe(full.properties.total)
	})

	test('exclude: atrules.media.browserhacks skips only media browserhacks', () => {
		const full = analyze(CSS)
		const result = analyze(CSS, { exclude: ['atrules.media.browserhacks'] })
		expect(result.atrules.media.browserhacks.total).toBe(0)
		// Other atrule data should still be present
		expect(result.atrules.total).toBe(full.atrules.total)
		expect(result.atrules.media.total).toBe(full.atrules.media.total)
	})

	test('include + exclude: include atrules then exclude atrules.media', () => {
		const result = analyze(CSS, { include: ['atrules'], exclude: ['atrules.media'] })
		expect(result.atrules.total).toBeGreaterThan(0)
		expect(result.atrules.keyframes.total).toBeGreaterThan(0)
		expect(result.atrules.media.total).toBe(0)
		// Non-included sections should be empty
		expect(result.selectors.total).toBe(0)
	})

	test('include: values.colors only collects color data', () => {
		const result = analyze(CSS, { include: ['values.colors'] })
		expect(result.values.colors.total).toBeGreaterThan(0)
		expect(result.values.fontSizes.total).toBe(0)
		expect(result.values.gradients.total).toBe(0)
		// declarations.total is 0 because 'declarations' is not included
		expect(result.declarations.total).toBe(0)
	})

	test('keyframes depth is always tracked even when atrules excluded', () => {
		// When excluding atrules but including declarations, keyframe context must be
		// tracked to correctly categorize importants in keyframes
		const result = analyze(CSS, { include: ['declarations'] })
		// Declarations inside keyframes should not be incorrectly flagged
		expect(result.declarations.total).toBeGreaterThan(0)
	})

	test('selectors.total is 0 when selectors section is excluded', () => {
		const full = analyze(CSS)
		const result = analyze(CSS, { exclude: ['selectors'] })
		// selectors.total is 0 since selectors section is excluded
		expect(result.selectors.total).toBe(0)
		// But sourceLinesOfCode still counts selector nodes via internal counter
		expect(result.stylesheet.sourceLinesOfCode).toBe(full.stylesheet.sourceLinesOfCode)
	})

	test('exclude: properties still runs declaration counting', () => {
		const full = analyze(CSS)
		const result = analyze(CSS, { exclude: ['properties'] })
		expect(result.properties.total).toBe(0)
		expect(result.declarations.total).toBe(full.declarations.total)
	})

	test('exclude: selectors.specificity.items omits items array but keeps aggregate stats', () => {
		const full = analyze(CSS)
		const result = analyze(CSS, { exclude: ['selectors.specificity.items'] })
		// Items array should be empty
		expect(result.selectors.specificity.items).toEqual([])
		// Aggregate stats should still be present
		expect(result.selectors.specificity.total).toBe(full.selectors.specificity.total)
		expect(result.selectors.specificity.max).toEqual(full.selectors.specificity.max)
		expect(result.selectors.specificity.sum).toEqual(full.selectors.specificity.sum)
	})

	test('exclude: selectors.complexity.items omits items array but keeps aggregate stats', () => {
		const full = analyze(CSS)
		const result = analyze(CSS, { exclude: ['selectors.complexity.items'] })
		expect(result.selectors.complexity.items).toEqual([])
		expect(result.selectors.complexity.total).toBe(full.selectors.complexity.total)
		expect(result.selectors.complexity.max).toBe(full.selectors.complexity.max)
	})

	test('exclude: rules.sizes.items omits items but keeps stats', () => {
		const full = analyze(CSS)
		const result = analyze(CSS, { exclude: ['rules.sizes.items'] })
		expect(result.rules.sizes.items).toEqual([])
		expect(result.rules.sizes.total).toBe(full.rules.sizes.total)
	})

	test('exclude: atrules.nesting.items omits items but keeps stats', () => {
		const full = analyze(CSS)
		const result = analyze(CSS, { exclude: ['atrules.nesting.items'] })
		expect(result.atrules.nesting.items).toEqual([])
		expect(result.atrules.nesting.total).toBe(full.atrules.nesting.total)
	})

	test('exclude: declarations.nesting.items omits items but keeps stats', () => {
		const full = analyze(CSS)
		const result = analyze(CSS, { exclude: ['declarations.nesting.items'] })
		expect(result.declarations.nesting.items).toEqual([])
		expect(result.declarations.nesting.total).toBe(full.declarations.nesting.total)
	})

	test('exported AnalysisPath type is used correctly', () => {
		// Type-level test: verify include/exclude accept AnalysisPath values
		const result1 = analyze(CSS, { include: ['atrules', 'selectors'] })
		const result2 = analyze(CSS, { exclude: ['values.colors', 'selectors.specificity'] })
		expect(result1).toBeDefined()
		expect(result2).toBeDefined()
	})
})

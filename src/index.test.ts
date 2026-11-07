import { test, expect, describe } from 'vitest'
import {
	analyze,
	compareSpecificity,
	get_complexity,
	get_accessibility_selectors,
	get_vendor_prefixes,
	get_media_browserhacks,
	get_supports_browserhacks,
	isPropertyHack,
	get_prefixed_values,
	get_value_browserhacks,
	hasVendorPrefix,
	cssKeywords,
	KeywordSet,
	// Color exports
	named_colors,
	system_colors,
	color_functions,
	color_keywords,
	type UniqueWithLocations,
	type Location,
	type Specificity,
} from './index.js'

describe('Public API', () => {
	test("exposes the 'analyze' method", () => {
		expect(typeof analyze).toBe('function')
	})

	test('exposes the "compareSpecificity" method', () => {
		expect(typeof compareSpecificity).toBe('function')
	})

	test('exposes the "get_complexity" method', () => {
		expect(typeof get_complexity).toBe('function')
	})

	test('exposes the "get_vendor_prefixes" method', () => {
		expect(typeof get_vendor_prefixes).toBe('function')
	})

	test('exposes the "get_accessibility_selectors" method', () => {
		expect(typeof get_accessibility_selectors).toBe('function')
	})

	test('exposes the "get_media_browserhacks" method', () => {
		expect(typeof get_media_browserhacks).toBe('function')
	})

	test('exposes the "get_supports_browserhacks" method', () => {
		expect(typeof get_supports_browserhacks).toBe('function')
	})

	test('exposes the "isPropertyHack" method', () => {
		expect(typeof isPropertyHack).toBe('function')
	})

	test('exposes the "get_prefixed_values" method', () => {
		expect(typeof get_prefixed_values).toBe('function')
	})

	test('exposes the "get_value_browserhacks" method', () => {
		expect(typeof get_value_browserhacks).toBe('function')
	})

	test('exposes the "hasVendorPrefix" method', () => {
		expect(typeof hasVendorPrefix).toBe('function')
	})

	test('exposes the "compareSpecificity" method', () => {
		expect(typeof compareSpecificity).toBe('function')
	})

	test('exposes the named_colors KeywordSet', () => {
		expect(named_colors.has('Red')).toBeTruthy()
	})

	test('exposes the system_colors KeywordSet', () => {
		expect(system_colors.has('LinkText')).toBeTruthy()
	})

	test('exposes the color_functions KeywordSet', () => {
		expect(color_functions.has('okLAB')).toBeTruthy()
	})

	test('exposes the color_keywords KeywordSet', () => {
		expect(color_keywords.has('TRANSPARENT')).toBeTruthy()
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
				defined: [],
				used: [],
				unused: [],
				unknown: [],
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
					defined: [],
					used: [],
					unused: [],
					unknown: [],
				},
			},
			layer: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
				defined: [],
				used: [],
				unused: [],
				unknown: [],
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
				defined: [],
				used: [],
				unused: [],
				unknown: [],
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
			anchorNames: {
				defined: [],
				used: [],
				unused: [],
				unknown: [],
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
				names: {
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

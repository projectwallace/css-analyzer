import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { normalize } from './normalize.js';
import { getResult as getV4Result } from './__fixtures__/normalize/v4.js'
import { getResult as getV5Result } from './__fixtures__/normalize/v5.0.0.js'

let Normalize = suite('Normalize')

Normalize('v4 - stylesheet', () => {
	let fixture = getV4Result()
	let actual = normalize(fixture)

	assert.equal(actual.stylesheet, {
		sourceLinesOfCode: 8184,
		linesOfCode: 12451,
		size: 242113,
		comments: {
			total: 0,
			size: 0,
		},
		embeddedContent: {
			total: 0,
			totalUnique: 0,
			uniquenessRatio: 0,
			unique: {},
			size: {
				total: 0,
				ratio: 0,
			},
		},
	})
})

Normalize('v4 - atrules', () => {
	let fixture = getV4Result()
	let actual = normalize(fixture)

	assert.equal(actual.atrules, {
		fontface: {
			total: 1,
			totalUnique: 1,
			unique: [
				{
					"font-family": '"Hero"',
					"font-style": "normal",
					"font-weight": "700",
					"src": 'url("__MY_URL__") format("woff2")',
				}
			],
			uniquenessRatio: 1,
		},
		import: {
			total: 1,
			totalUnique: 1,
			unique: {
				"url(__MY_IMPORT__)": 1
			},
			uniquenessRatio: 1,
		},
		media: {
			total: 397,
			totalUnique: 10,
			unique: {
				"(min-width: 576px)": 4,
				"(min-width: 768px)": 109,
				"(min-width: 992px)": 171,
				"(min-width: 1200px)": 34,
				"(min-width: 1400px)": 73,
				"only screen and (max-width: 426px)": 1,
				"print": 1,
				"screen and (min-width: 410px)": 1,
				"screen and (min-width: 414px)": 2,
				"screen and (min-width: 1400px)": 1
			},
			uniquenessRatio: 10 / 397,
			browserhacks: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
			}
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
			}
		},
		keyframes: {
			total: 1,
			totalUnique: 1,
			unique: {
				'spinner-border': 1,
			},
			uniquenessRatio: 1,
			prefixed: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
				ratio: 0,
			}
		},
		container: {
			total: 0,
			totalUnique: 0,
			unique: {},
			uniquenessRatio: 0,
		},
		layer: {
			total: 0,
			totalUnique: 0,
			unique: {},
			uniquenessRatio: 0,
		},
	})
})

Normalize('v4 - rules', () => {
	let fixture = getV4Result()
	let actual = normalize(fixture)

	assert.equal(actual.rules, {
		total: 2301,
		empty: {
			total: 4,
			ratio: 4 / 2301,
		},
		sizes: {
			max: 0,
			min: 0,
			range: 0,
			mean: 0,
			median: 0,
			mode: 0,
			sum: 0,
			items: [],
			unique: {},
			totalUnique: 0,
			uniquenessRatio: 0,
		},
		selectors: {
			max: 14,
			min: 1,
			range: 13,
			mean: 2581 / 2301, // rules per selector
			median: 0,
			mode: 0,
			sum: 0,
			items: [],
			unique: {},
			totalUnique: 0,
			uniquenessRatio: 0,
		},
		declarations: {
			max: 51,
			min: 0,
			range: 0,
			mean: 5202 / 2301, // declarations per rule
			median: 0,
			mode: 0,
			sum: 0,
			items: [],
			unique: {},
			totalUnique: 0,
			uniquenessRatio: 0,
		},
	})
})

Normalize('v4 - selectors', () => {
	let fixture = getV4Result()
	let actual = normalize(fixture)

	assert.equal(actual.selectors, {
		total: 2581,
		totalUnique: 2101,
		uniquenessRatio: 2101 / 2581,
		specificity: {
			min: [0, 0, 0],
			max: [1, 2, 3],
			sum: [0, 0, 0],
			mean: [0, 0, 0],
			mode: [0, 0, 0],
			median: [0, 0, 0],
			items: [],
			unique: {},
			totalUnique: 0,
			uniquenessRatio: 0,
		},
		complexity: {
			max: 6,
			min: 0, // todo: unique.min
			range: 0, // todo: max-min
			mean: 1.481983727237505,
			median: 0, //todo:calc from unique
			mode: 0,//todo: calc from unique
			sum: 3825,
			total: 0, // todo: calc from unique
			totalUnique: 7,
			uniquenessRatio: 0,
			unique: {
				0: 1,
				1: 1814,
				2: 441,
				3: 223,
				4: 65,
				5: 22,
				6: 15,
			},
			items: [],
		},
		id: {
			total: 3,
			totalUnique: 2,
			unique: {
				'#tablepress-1.tablepress-id-1': 2,
				'#tablepress-1.tablepress-id-1 table': 1,
			},
			uniquenessRatio: 2 / 3,
			ratio: 3 / 2581,
		},
		accessibility: {
			total: 1,
			totalUnique: 1,
			uniquenessRatio: 1,
			unique: {
				'[role=button]': 1,
			},
		},
		keyframes: {
			total: 0,
			totalUnique: 0,
			uniquenessRatio: 0,
			unique: {},
		}
	})
})

Normalize('v4 - declarations', () => {
	let fixture = getV4Result()
	let actual = normalize(fixture)

	assert.equal(actual.declarations, {
		total: 5202,
		totalUnique: 1230,
		uniquenessRatio: 1230 / 5202,
		unique: {
			total: 1230,
			ratio: 1230 / 5202,
		},
		importants: {
			total: 1046,
			ratio: 1046 / 5202,
			inKeyframes: {
				total: 0,
				ratio: 0,
			},
		},
	})
})

Normalize('v4 - properties', () => {
	let fixture = getV4Result()
	let actual = normalize(fixture)

	assert.equal(actual.properties, {
		total: 5202,
		totalUnique: 158,
		unique: {
			"--bs-black-rgb": 1,
			"--bs-blue": 1,
			"--bs-body-bg": 1,
			"--bs-body-bg-rgb": 1,
			"--bs-body-color": 1,
			"--bs-body-color-rgb": 1,
			"--bs-body-font-family": 1,
			"--bs-body-font-size": 1,
			"--bs-body-font-weight": 1,
			"--bs-body-line-height": 1,
			"--bs-cyan": 1,
			"--bs-danger": 1,
			"--bs-danger-rgb": 1,
			"--bs-dark": 1,
			"--bs-dark-rgb": 1,
			"--bs-font-monospace": 1,
			"--bs-font-sans-serif": 1,
			"--bs-gradient": 1,
			"--bs-gray": 1,
			"--bs-gray-100": 1,
			"--bs-gray-200": 1,
			"--bs-gray-300": 1,
			"--bs-gray-400": 1,
			"--bs-gray-500": 1,
			"--bs-gray-600": 1,
			"--bs-gray-700": 1,
			"--bs-gray-800": 1,
			"--bs-gray-900": 1,
			"--bs-gray-dark": 1,
			"--bs-green": 1,
			"--bs-gutter-x": 40,
			"--bs-gutter-y": 37,
			"--bs-indigo": 1,
			"--bs-info": 1,
			"--bs-info-rgb": 1,
			"--bs-light": 1,
			"--bs-light-rgb": 1,
			"--bs-orange": 1,
			"--bs-pink": 1,
			"--bs-primary": 1,
			"--bs-primary-rgb": 1,
			"--bs-purple": 1,
			"--bs-red": 1,
			"--bs-secondary": 1,
			"--bs-secondary-rgb": 1,
			"--bs-success": 1,
			"--bs-success-rgb": 1,
			"--bs-teal": 1,
			"--bs-warning": 1,
			"--bs-warning-rgb": 1,
			"--bs-white": 1,
			"--bs-white-rgb": 1,
			"--bs-yellow": 1,
			"--swiper-navigation-color": 13,
			"--swiper-navigation-size": 1,
			"--swiper-pagination-color": 13,
			"--swiper-theme-color": 1,
			"-ms-overflow-style": 1,
			"-o-object-fit": 5,
			"-webkit-appearance": 5,
			"-webkit-text-decoration": 1,
			"-webkit-text-size-adjust": 1,
			"align-content": 37,
			"align-items": 48,
			"align-self": 39,
			"animation": 1,
			"appearance": 1,
			"background": 133,
			"background-attachment": 3,
			"background-color": 122,
			"background-image": 21,
			"background-position": 5,
			"background-repeat": 5,
			"background-size": 82,
			"border": 23,
			"border-bottom": 3,
			"border-color": 8,
			"border-radius": 117,
			"border-right": 1,
			"border-right-color": 1,
			"border-style": 2,
			"border-top": 1,
			"bottom": 44,
			"box-shadow": 100,
			"box-sizing": 7,
			"clear": 1,
			"color": 194,
			"contain-intrinsic-size": 1,
			"content": 55,
			"content-visibility": 2,
			"cursor": 12,
			"display": 295,
			"filter": 1,
			"flex": 140,
			"flex-direction": 58,
			"flex-grow": 12,
			"flex-shrink": 18,
			"flex-wrap": 22,
			"float": 2,
			"font": 1,
			"font-family": 46,
			"font-size": 180,
			"font-style": 7,
			"font-variant": 1,
			"font-weight": 40,
			"height": 235,
			"justify-content": 52,
			"left": 58,
			"letter-spacing": 1,
			"line-height": 216,
			"list-style": 4,
			"margin": 184,
			"margin-bottom": 187,
			"margin-left": 177,
			"margin-right": 116,
			"margin-top": 113,
			"max-height": 1,
			"max-width": 65,
			"min-height": 8,
			"min-width": 1,
			"object-fit": 5,
			"opacity": 62,
			"order": 48,
			"outline": 4,
			"outline-offset": 1,
			"overflow": 14,
			"overflow-x": 1,
			"padding": 158,
			"padding-bottom": 78,
			"padding-left": 89,
			"padding-right": 94,
			"padding-top": 105,
			"perspective": 1,
			"pointer-events": 4,
			"position": 165,
			"resize": 1,
			"right": 73,
			"scroll-snap-align": 1,
			"scroll-snap-type": 2,
			"scrollbar-width": 1,
			"src": 2,
			"text-align": 78,
			"text-align-last": 1,
			"text-decoration": 40,
			"text-transform": 5,
			"top": 105,
			"touch-action": 2,
			"transform": 41,
			"transform-origin": 3,
			"transform-style": 1,
			"transition": 55,
			"transition-property": 3,
			"transition-timing-function": 1,
			"vertical-align": 5,
			"visibility": 5,
			"white-space": 5,
			"width": 416,
			"z-index": 48
		},
		uniquenessRatio: 158 / 5202,
		prefixed: {
			total: 13,
			totalUnique: 5,
			unique: {
				'-ms-overflow-style': 1,
				'-o-object-fit': 5,
				'-webkit-appearance': 5,
				'-webkit-text-decoration': 1,
				'-webkit-text-size-adjust': 1,
			},
			uniquenessRatio: 5 / 13,
			ratio: 13 / 5202,
		},
		custom: {
			total: 156,
			totalUnique: 57,
			unique: {
				"--bs-black-rgb": 1,
				"--bs-blue": 1,
				"--bs-body-bg": 1,
				"--bs-body-bg-rgb": 1,
				"--bs-body-color": 1,
				"--bs-body-color-rgb": 1,
				"--bs-body-font-family": 1,
				"--bs-body-font-size": 1,
				"--bs-body-font-weight": 1,
				"--bs-body-line-height": 1,
				"--bs-cyan": 1,
				"--bs-danger": 1,
				"--bs-danger-rgb": 1,
				"--bs-dark": 1,
				"--bs-dark-rgb": 1,
				"--bs-font-monospace": 1,
				"--bs-font-sans-serif": 1,
				"--bs-gradient": 1,
				"--bs-gray": 1,
				"--bs-gray-100": 1,
				"--bs-gray-200": 1,
				"--bs-gray-300": 1,
				"--bs-gray-400": 1,
				"--bs-gray-500": 1,
				"--bs-gray-600": 1,
				"--bs-gray-700": 1,
				"--bs-gray-800": 1,
				"--bs-gray-900": 1,
				"--bs-gray-dark": 1,
				"--bs-green": 1,
				"--bs-gutter-x": 40,
				"--bs-gutter-y": 37,
				"--bs-indigo": 1,
				"--bs-info": 1,
				"--bs-info-rgb": 1,
				"--bs-light": 1,
				"--bs-light-rgb": 1,
				"--bs-orange": 1,
				"--bs-pink": 1,
				"--bs-primary": 1,
				"--bs-primary-rgb": 1,
				"--bs-purple": 1,
				"--bs-red": 1,
				"--bs-secondary": 1,
				"--bs-secondary-rgb": 1,
				"--bs-success": 1,
				"--bs-success-rgb": 1,
				"--bs-teal": 1,
				"--bs-warning": 1,
				"--bs-warning-rgb": 1,
				"--bs-white": 1,
				"--bs-white-rgb": 1,
				"--bs-yellow": 1,
				"--swiper-navigation-color": 13,
				"--swiper-navigation-size": 1,
				"--swiper-pagination-color": 13,
				"--swiper-theme-color": 1
			},
			uniquenessRatio: 57 / 156,
			ratio: 156 / 5202,
		},
		browserhacks: {
			total: 1,
			totalUnique: 1,
			unique: {
				'*zoom': 1
			},
			uniquenessRatio: 1,
			ratio: 1 / 5202,
		},
		complexity: {
			max: 0,
			min: 0,
			range: 0,
			mean: 0,
			median: 0,
			mode: 0,
			sum: 0,
		},
	})
})

Normalize('v4 - values', () => {
	let fixture = getV4Result()
	let actual = normalize(fixture)

	assert.equal(actual.values.colors, {
		total: 520,
		totalUnique: 76,
		unique: {
			"#fd7e14": 3,
			"#ffbe0a": 9,
			"#fdc731": 9,
			"rgba(253, 199, 49, 0.7)": 9,
			"rgba(253, 199, 49, 0.5)": 18,
			"#f6b500": 13,
			"#198754": 4,
			"#4ce2a7": 11,
			"rgba(76, 226, 167, 0.7)": 7,
			"rgba(76, 226, 167, 0.5)": 14,
			"#09da88": 7,
			"#19ce87": 7,
			"#20c997": 3,
			"#0dcaf0": 4,
			"#e8f9ff": 5,
			"#b1e9ff": 18,
			"rgba(177, 233, 255, 0.5)": 1,
			"#c8efff": 1,
			"#96dcfc": 1,
			"#d9edf7": 1,
			"#f7f9fa": 1,
			"#189ae4": 7,
			"#41b1f1": 48,
			"rgba(65, 177, 241, 0.7)": 5,
			"rgba(65, 177, 241, 0.5)": 11,
			"#1ca6f5": 5,
			"#d7dde1": 3,
			"#f1f9ff": 7,
			"#6c757d": 5,
			"#e9ecef": 1,
			"#ced4da": 1,
			"#495057": 1,
			"#343a40": 4,
			"#212529": 3,
			"#adb5bd": 1,
			"#f8f9fa": 2,
			"#dee2e6": 1,
			"#007aff": 1,
			"#4a5159": 4,
			"#94a2b3": 17,
			"rgba(148, 162, 179, 0.3)": 2,
			"#708db1": 6,
			"#0d6efd": 4,
			"rgba(215, 228, 249, 0.8)": 1,
			"rgba(215, 228, 249, 0.75)": 2,
			"rgba(215, 228, 249, 0.5)": 11,
			"rgba(190, 209, 242, 0.8)": 1,
			"#323341": 45,
			"rgba(50, 51, 65, 0.69)": 1,
			"rgba(50, 51, 65, 0.5)": 2,
			"#6f42c1": 3,
			"#6610f2": 3,
			"rgba(43, 41, 45, 0.2)": 1,
			"#ff4861": 3,
			"#ff566d": 3,
			"#ff6b7f": 9,
			"rgba(255, 107, 127, 0.7)": 3,
			"rgba(255, 107, 127, 0.5)": 6,
			"#dc3545": 4,
			"#fff": 88,
			"#FFFFFF": 2,
			"rgba(255, 255, 255, 0.9)": 2,
			"rgba(255, 255, 255, 0.7)": 24,
			"rgba(255, 255, 255, 0.15)": 1,
			"#fafafa": 2,
			"#eee": 1,
			"rgba(71, 71, 71, 0.8)": 1,
			"#000": 1,
			"#000000": 1,
			"rgba(0, 0, 0, 0.5)": 4,
			"rgba(0, 0, 0, 0.25)": 1,
			"rgba(0, 0, 0, 0.08)": 2,
			"rgba(0, 0, 0, 0.0784313725)": 1,
			"rgba(0, 0, 0, 0.05)": 1,
			"rgba(0, 0, 0, 0)": 4,
			"rgba(255, 255, 255, 0)": 1
		},
		uniquenessRatio: 76 / 520,
		itemsPerContext: {}
	}, 'colors should match')
	assert.equal(actual.values.fontFamilies, {
		total: 2,
		totalUnique: 2,
		unique: {
			'"Hero"': 1,
			'"Hero", "Poppins", Verdana, sans-serif': 1,
		},
		uniquenessRatio: 1
	}, 'font-families should match')
	assert.equal(actual.values.fontSizes, {
		total: 179,
		totalUnique: 2,
		unique: {
			'var(--swiper-navigation-size)': 170,
			'0': 9
		},
		uniquenessRatio: 2 / 179
	}, 'fontSizes should match')
	assert.equal(actual.values.zindexes, {
		total: 16,
		totalUnique: 2,
		unique: {
			'-2': 3,
			'-1': 13
		},
		uniquenessRatio: 2 / 16
	}, 'zindexes should match')
	assert.equal(actual.values.textShadows, {
		total: 1,
		totalUnique: 1,
		unique: {
			'1px 1px 0 #000': 1,
		},
		uniquenessRatio: 1,
	}, 'textShadows should match')
	assert.equal(actual.values.boxShadows, {
		total: 11,
		totalUnique: 2,
		unique: {
			'0px -4px 7px 0px rgba(0, 0, 0, 0.0784313725) inset': 1,
			'0px 8px 30px rgba(65, 177, 241, 0.5)': 10,
		},
		uniquenessRatio: 2 / 11,
	}, 'boxShadows should match')
	assert.equal(actual.values.animations.durations, {
		total: 60,
		totalUnique: 5,
		unique: {
			'200ms': 6,
			'0.2s': 49,
			'300ms': 3,
			'0.3s': 1,
			'0.75s': 1,
		},
		uniquenessRatio: 5 / 60,
	}, 'durations should match')
	assert.equal(actual.values.animations.timingFunctions, {
		total: 3,
		totalUnique: 3,
		unique: {
			'ease-in-out': 1,
			'ease-out': 1,
			'linear': 1,
		},
		uniquenessRatio: 1,
	}, 'timingFunctions should match')
	assert.equal(actual.values.prefixes, {
		total: 1,
		totalUnique: 1,
		unique: {
			'-webkit-fill-available': 1,
		},
		uniquenessRatio: 1,
	}, 'prefixes should match')
	assert.equal(actual.values.browserhacks, {
		total: 1,
		totalUnique: 1,
		unique: {
			'0 !ie': 1,
		},
		uniquenessRatio: 1,
	}, 'browserhacks should match')
})

Normalize('polyfills v5.0.0', () => {
	let fixture = getV5Result()
	let actual = normalize(fixture)

	// v5.1.0: embedded content
	assert.equal(actual.stylesheet.embeddedContent, {
		total: 0,
		totalUnique: 0,
		unique: {},
		uniquenessRatio: 0,
		size: {
			total: 0,
			ratio: 0,
		}
	})

	// v5.2.0: @layer
	assert.equal(actual.atrules.layer, {
		total: 0,
		totalUnique: 0,
		unique: {},
		uniquenessRatio: 0,
	})

	// v5.5.0: RuleSet sizes
	assert.equal(actual.rules.sizes, {
		min: 0,
		max: 0,
		mean: 0,
		mode: 0,
		median: 0,
		range: 0,
		sum: 0,
		items: [],
		unique: {},
		totalUnique: 0,
		uniquenessRatio: 0,
	})

	// // v5.5.0: Selector/Declaration per Rule uniqueness
	assert.equal(actual.rules.selectors.unique, {})
	assert.is(actual.rules.selectors.uniquenessRatio, 0)
	assert.is(actual.rules.selectors.totalUnique, 0)
	assert.equal(actual.rules.declarations.unique, {})
	assert.is(actual.rules.declarations.uniquenessRatio, 0)
	assert.is(actual.rules.declarations.totalUnique, 0)

	// v5.5.0: Selector specificity uniqueness
	assert.equal(actual.selectors.specificity.unique, {})
	assert.is(actual.selectors.specificity.uniquenessRatio, 0)
	assert.is(actual.selectors.specificity.totalUnique, 0)
})

Normalize.run()
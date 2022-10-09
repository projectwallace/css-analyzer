import { ratio } from "./index.js"

/**
 *
 * @param {Object} result
 * @returns {Object} updatedResult
 */
export function normalize(result) {
	let version = getVersion(result)

	if (version === 1) {
		return polyfillFrom1(result)
	}
	if (version === 2) {
		return polyfillFrom2(result)
	}
	// Version 3 does not exist...
	if (version === 4) {
		return polyfillFrom4(result)
	}
	// Polyfill newly added features
	return polyfillFrom5(result)
}

function getVersion(result) {
	if ('__meta__' in result) {
		return 5
	}

	// V2 used a flattened structure
	if ('rules.total' in result) {
		return 2
	}

	// V1 had values.total from the start
	if ('values' in result && 'total' in result.values) {
		return 1
	}
}
function polyfillFrom5(result) {
	// v5.1.0: Embedded content added
	if (!('embeddedContent' in result.stylesheet)) {
		result.stylesheet.embeddedContent = {
			total: 0,
			totalUnique: 0,
			unique: {},
			uniquenessRatio: 0,
			size: {
				total: 0,
				ratio: 0,
			}
		}
	}

	// v5.2.0: @layer added
	if (!('layer' in result.atrules)) {
		result.atrules.layer = {
			total: 0,
			totalUnique: 0,
			unique: {},
			uniquenessRatio: 0,
		}
	}

	// v5.5.0: RuleSet sizes
	if (!('sizes' in result.rules)) {
		result.rules.sizes = {
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
		}
	}

	// v5.5.0:
	// - count unique selectors per rule
	// - count unique declarations per rule
	if (!('unique' in result.rules.selectors)) {
		result.rules.selectors.unique = {}
		result.rules.selectors.totalUnique = 0
		result.rules.selectors.uniquenessRatio = 0
		result.rules.declarations.unique = {}
		result.rules.declarations.totalUnique = 0
		result.rules.declarations.uniquenessRatio = 0
	}

	// v5.5.0: Selector specificity uniqueness
	if (!('totalUnique' in result.selectors.specificity)) {
		result.selectors.specificity.unique = {}
		result.selectors.specificity.totalUnique = 0
		result.selectors.specificity.uniquenessRatio = 0
	}

	return result
}

function polyfillFrom1(result) {
	console.log(result.atrules.fontfaces.unique)
	return {
		"stylesheet": {
			"sourceLinesOfCode": 0,
			"linesOfCode": 0,
			"size": result.stylesheets.size,
			"comments": {
				"total": 0,
				"size": 0
			},
			"embeddedContent": {
				"total": 0,
				"totalUnique": 0,
				"unique": {},
				"uniquenessRatio": 0,
				"size": {
					"total": 0,
					"ratio": 0
				}
			}
		},
		"atrules": {
			"fontface": {
				"total": result.atrules.fontfaces.total,
				"totalUnique": result.atrules.fontfaces.totalUnique,
				"unique": result.atrules.fontfaces.unique.map(fontface => {
					console.log(fontface.value.map(m => m.property))
					return fontface.value.reduce(([acc, curr]) => {
						console.log({ acc })
						acc[curr.property] = curr.value
					}, {})
				}),
				"uniquenessRatio": ratio(result.atrules.fontfaces.totalUnique, result.atrules.fontfaces.total)
			},
			"import": {
				"total": 0,
				"totalUnique": 0,
				"unique": {},
				"uniquenessRatio": 0
			},
			"media": {
				"total": 0,
				"totalUnique": 0,
				"unique": {},
				"uniquenessRatio": 0,
				"browserhacks": {
					"total": 0,
					"totalUnique": 0,
					"unique": {},
					"uniquenessRatio": 0,
				},
			},
			"charset": {
				"total": 0,
				"totalUnique": 0,
				"unique": {},
				"uniquenessRatio": 0,
			},
			"supports": {
				"total": 0,
				"totalUnique": 0,
				"unique": {},
				"uniquenessRatio": 0,
				"browserhacks": {
					"total": 0,
					"totalUnique": 0,
					"unique": {},
					"uniquenessRatio": 0,
				},
			},
			"keyframes": {
				"total": 0,
				"totalUnique": 0,
				"unique": {},
				"uniquenessRatio": 0,
				"prefixed": {
					"total": 0,
					"totalUnique": 0,
					"unique": {},
					"uniquenessRatio": 0,
					"ratio": 0
				}
			},
			"container": {
				"total": 0,
				"totalUnique": 0,
				"unique": {},
				"uniquenessRatio": 0
			},
			"layer": {
				"total": 0,
				"totalUnique": 0,
				"unique": {},
				"uniquenessRatio": 0
			}
		},
		"rules": {
			"total": 0,
			"empty": {
				"total": 0,
				"ratio": 0,
			},
			"sizes": {
				"min": 0,
				"max": 0,
				"mean": 0,
				"mode": 0,
				"median": 0,
				"range": 0,
				"sum": 0,
				"items": [],
				"unique": {},
				"totalUnique": 0,
				"uniquenessRatio": 0,
			},
			"selectors": {
				"min": 0,
				"max": 0,
				"mean": 0,
				"mode": 0,
				"median": 0,
				"range": 0,
				"sum": 0,
				"items": [],
				"unique": {},
				"totalUnique": 0,
				"uniquenessRatio": 0,
			},
			"declarations": {
				"min": 0,
				"max": 0,
				"mean": 0,
				"mode": 0,
				"median": 0,
				"range": 0,
				"sum": 0,
				"items": [],
				"unique": {},
				"totalUnique": 0,
				"uniquenessRatio": 0,
			}
		},
		"selectors": {
			"total": 0,
			"totalUnique": 0,
			"uniquenessRatio": 0,
			"specificity": {
				"min": [0, 0, 0],
				"max": [0, 0, 0],
				"sum": [
					0,
					0,
					0,
				],
				"mean": [
					0,
					0,
					0,
				],
				"mode": [
					0,
					0,
					0,
				],
				"median": [
					0,
					0,
					0,
				],
				"items": [],
				"unique": {},
				"totalUnique": 0,
				"uniquenessRatio": 0,
			},
			"complexity": {
				"min": 0,
				"max": 0,
				"mean": 0,
				"mode": 0,
				"median": 0,
				"range": 0,
				"sum": 0,
				"total": 0,
				"totalUnique": 0,
				"unique": {},
				"uniquenessRatio": 0,
				"items": []
			},
			"id": {
				"total": 0,
				"totalUnique": 0,
				"unique": {},
				"uniquenessRatio": 0,
				"ratio": 0
			},
			"accessibility": {
				"total": 0,
				"totalUnique": 0,
				"unique": {},
				"uniquenessRatio": 0,
				"ratio": 0
			},
			"keyframes": {
				"total": 0,
				"totalUnique": 0,
				"unique": {},
				"uniquenessRatio": 0
			}
		},
		"declarations": {
			"total": 0,
			"totalUnique": 0,
			"uniquenessRatio": 0,
			"unique": {
				"total": 0,
				"ratio": 0
			},
			"importants": {
				"total": 0,
				"ratio": 0,
				"inKeyframes": {
					"total": 0,
					"ratio": 0
				}
			}
		},
		"properties": {
			"total": 0,
			"totalUnique": 0,
			"unique": {},
			"uniquenessRatio": 0,
			"prefixed": {
				"total": 0,
				"totalUnique": 0,
				"unique": {},
				"uniquenessRatio": 0,
				"ratio": 0
			},
			"custom": {
				"total": 0,
				"totalUnique": 0,
				"unique": {},
				"uniquenessRatio": 0,
				"ratio": 0
			},
			"browserhacks": {
				"total": 0,
				"totalUnique": 0,
				"unique": {},
				"uniquenessRatio": 0,
				"ratio": 0
			},
			"complexity": {
				"min": 0,
				"max": 0,
				"mean": 0,
				"mode": 0,
				"median": 0,
				"range": 0,
				"sum": 0,
			}
		},
		"values": {
			"colors": {
				"total": 0,
				"totalUnique": 0,
				"unique": {},
				"uniquenessRatio": 0,
				"itemsPerContext": {}
			},
			"fontFamilies": {
				"total": 0,
				"totalUnique": 0,
				"unique": {},
				"uniquenessRatio": 0
			},
			"fontSizes": {
				"total": 0,
				"totalUnique": 0,
				"unique": {},
				"uniquenessRatio": 0
			},
			"zindexes": {
				"total": 0,
				"totalUnique": 0,
				"unique": {},
				"uniquenessRatio": 0
			},
			"textShadows": {
				"total": 0,
				"totalUnique": 0,
				"unique": {},
				"uniquenessRatio": 0
			},
			"boxShadows": {
				"total": 0,
				"totalUnique": 0,
				"unique": {},
				"uniquenessRatio": 0
			},
			"animations": {
				"durations": {
					"total": 0,
					"totalUnique": 0,
					"unique": {},
					"uniquenessRatio": 0
				},
				"timingFunctions": {
					"total": 0,
					"totalUnique": 0,
					"unique": {},
					"uniquenessRatio": 0
				}
			},
			"prefixes": {
				"total": 0,
				"totalUnique": 0,
				"unique": {},
				"uniquenessRatio": 0
			},
			"browserhacks": {
				"total": 0,
				"totalUnique": 0,
				"unique": {},
				"uniquenessRatio": 0
			},
			"units": {
				"total": 0,
				"totalUnique": 0,
				"unique": {},
				"uniquenessRatio": 0,
				"itemsPerContext": {}
			}
		},
	}
}

import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { normalize } from './normalize.js';
import { getResult as getV1Result } from './__fixtures__/normalize/v1.js'
import { getResult as getV5Result } from './__fixtures__/normalize/v5.0.0.js'

let Normalize = suite('Normalize')

Normalize.skip('upgrades v1', () => {
	let fixture = getV1Result()
	let actual = normalize(fixture)
	let expected = {
		"stylesheet": {
			"sourceLinesOfCode": 0,
			"linesOfCode": 0,
			"size": 359832,
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
				"total": 1,
				"totalUnique": 1,
				"unique": [
					{
						'font-family': 'Noto Sans',
						'src': 'url("domain.tld")',
					}
				],
				"uniquenessRatio": 0
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

	assert.equal(actual, expected)
})

Normalize.skip('upgrades v2')
Normalize.skip('upgrades v4')

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
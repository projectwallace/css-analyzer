const { FORMATS, AGGREGATES } = require('./_types')
const uniqueWithCount = require('array-unique-with-count')
const { stripSelectorAnalysis } = require('../analyze')

function stripUnique(item) {
	return {
		...item,
		value: stripSelectorAnalysis(item.value).value,
	}
}

module.exports = ({ atrules, rules }) => {
	const selectors = rules
		.map((rule) => rule.selectors)
		.reduce((all, current) => all.concat(current), [])
	const unique = uniqueWithCount(selectors).map(stripUnique)

	// JavaScript
	const js = selectors.filter((s) => s.stats.isJavaScript)
	const jsUnique = uniqueWithCount(js).map(stripUnique)

	// ID
	const id = selectors.filter((s) => s.stats.isId)
	const idUnique = uniqueWithCount(id).map(stripUnique)

	// Accessibility
	const accessibility = selectors.filter((s) => s.stats.isAccessibility)
	const accessibilityUnique = uniqueWithCount(accessibility).map(stripUnique)

	// Universal
	const universal = selectors.filter((s) => s.stats.isUniversal)
	const universalUnique = uniqueWithCount(universal).map(stripUnique)

	// Browser Hacks
	const browserhacks = selectors.filter((s) => s.stats.isBrowserhack)
	const browserhacksUnique = uniqueWithCount(browserhacks).map(stripUnique)

	// Complexities
	const complexities = selectors.map((s) => {
		return {
			value: s.stats.complexity,
			stats: {
				key: s.stats.complexity,
			},
		}
	})
	const complexitiesUnique = uniqueWithCount(complexities).map(stripUnique)
	const maxComplexity = Math.max(...complexities.map((c) => c.value))
	const maxComplexitySelectors = uniqueWithCount(
		selectors.filter((s) => s.stats.complexity === maxComplexity)
	).map(stripUnique)
	const complexitySum = selectors
		.map((s) => s.stats.complexity)
		.reduce((total, complexity) => (total += complexity), 0)

	return [
		{
			id: 'selectors.total',
			value: selectors.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'selectors.total_unique',
			value: unique.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'selectors.unique',
			value: unique,
			format: FORMATS.SELECTOR,
			aggregate: AGGREGATES.LIST,
		},
		{
			id: 'selectors.js.total',
			value: js.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'selectors.js.total_unique',
			value: jsUnique.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'selectors.js.unique',
			value: jsUnique,
			format: FORMATS.SELECTOR,
			aggregate: AGGREGATES.LIST,
		},
		{
			id: 'selectors.js.ratio',
			value: js.length / selectors.length,
			format: FORMATS.RATIO,
			aggregate: AGGREGATES.RATIO,
		},
		{
			id: 'selectors.id.total',
			value: id.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'selectors.id.total_unique',
			value: idUnique.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'selectors.id.unique',
			value: idUnique,
			format: FORMATS.SELECTOR,
			aggregate: AGGREGATES.LIST,
		},
		{
			id: 'selectors.id.ratio',
			value: id.length / selectors.length,
			format: FORMATS.RATIO,
			aggregate: AGGREGATES.RATIO,
		},
		{
			id: 'selectors.accessibility.total',
			value: accessibility.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'selectors.accessibility.total_unique',
			value: accessibilityUnique.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'selectors.accessibility.unique',
			value: accessibilityUnique,
			format: FORMATS.SELECTOR,
			aggregate: AGGREGATES.LIST,
		},
		{
			id: 'selectors.accessibility.ratio',
			value: accessibility.length / selectors.length,
			format: FORMATS.RATIO,
			aggregate: AGGREGATES.RATIO,
		},
		{
			id: 'selectors.universal.total',
			value: universal.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'selectors.universal.total_unique',
			value: universalUnique.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'selectors.universal.unique',
			value: universalUnique,
			format: FORMATS.SELECTOR,
			aggregate: AGGREGATES.LIST,
		},
		{
			id: 'selectors.universal.ratio',
			value: universal.length / selectors.length,
			format: FORMATS.RATIO,
			aggregate: AGGREGATES.RATIO,
		},
		{
			id: 'selectors.browserhacks.total',
			value: browserhacks.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'selectors.browserhacks.total_unique',
			value: browserhacksUnique.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'selectors.browserhacks.unique',
			value: browserhacksUnique,
			format: FORMATS.SELECTOR,
			aggregate: AGGREGATES.LIST,
		},
		{
			id: 'selectors.browserhacks.ratio',
			value: browserhacks.length / selectors.length,
			format: FORMATS.RATIO,
			aggregate: AGGREGATES.RATIO,
		},
		{
			id: 'selectors.complexity.maximum.value',
			value: maxComplexity,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'selectors.complexity.maximum.selectors',
			value: maxComplexitySelectors,
			format: FORMATS.SELECTOR,
			aggregate: AGGREGATES.LIST,
		},
		{
			id: 'selectors.complexity.maximum.count',
			value: maxComplexitySelectors.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'selectors.complexity.average',
			value: complexitySum / selectors.length,
			format: FORMATS.RATIO,
			aggregate: AGGREGATES.AVERAGE,
		},
		{
			id: 'selectors.complexity.total',
			value: complexitySum,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'selectors.complexity.total_unique',
			value: complexitiesUnique.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'selectors.complexity.unique',
			value: complexitiesUnique,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.LIST,
		},
	]
}

const { FORMATS, AGGREGATES } = require('./_types')
const { stripPropertyAnalysis } = require('../analyze')
const uniqueWithCount = require('array-unique-with-count')

function stripUnique(item) {
	return {
		...item,
		value: stripPropertyAnalysis(item.value),
	}
}

module.exports = ({ atrules, rules }) => {
	const properties = rules
		.map((rule) => rule.declarations)
		.reduce((all, current) => all.concat(current), [])
		.map((declaration) => declaration.property)

	const unique = uniqueWithCount(properties).map(stripUnique)

	// Browserhacks
	const browserhacks = properties.filter((p) => p.stats.isBrowserHack)
	const uniqueBrowserhacks = uniqueWithCount(browserhacks).map(stripUnique)

	// Vendor prefixes
	const vendorPrefixes = properties.filter((p) => p.stats.isVendorPrefixed)
	const uniqueVendorPrefixes = uniqueWithCount(vendorPrefixes).map(stripUnique)

	return [
		{
			id: 'properties.total',
			value: properties.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'properties.unique.total',
			value: unique.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'properties.unique.ratio',
			value: unique.length / properties.length,
			format: FORMATS.RATIO,
			aggregate: AGGREGATES.AVERAGE,
		},
		{
			id: 'properties.unique',
			value: unique,
			format: FORMATS.PROPERTY,
			aggregate: AGGREGATES.LIST,
		},
		{
			id: 'properties.prefixed.total',
			value: vendorPrefixes.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'properties.prefixed.unique',
			value: uniqueVendorPrefixes,
			format: FORMATS.PROPERTY,
			aggregate: AGGREGATES.LIST,
		},
		{
			id: 'properties.prefixed.unique.total',
			value: uniqueVendorPrefixes.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'properties.prefixed.ratio',
			value: vendorPrefixes.length / properties.length,
			format: FORMATS.PROPERTY,
			aggregate: AGGREGATES.LIST,
		},
		{
			id: 'properties.browserhacks.total',
			value: browserhacks.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'properties.browserhacks.unique',
			value: uniqueBrowserhacks,
			format: FORMATS.PROPERTY,
			aggregate: AGGREGATES.LIST,
		},
		{
			id: 'properties.browserhacks.unique.total',
			value: uniqueBrowserhacks.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'properties.browserhacks.ratio',
			value: browserhacks.length / properties.length,
			format: FORMATS.PROPERTY,
			aggregate: AGGREGATES.LIST,
		},
	]
}

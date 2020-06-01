const { FORMATS, AGGREGATES } = require('./_types')
const { stripValueAnalysis } = require('../analyze')
const uniqueWithCount = require('array-unique-with-count')

const KEYWORDS = ['auto', 'inherit', 'initial', 'none', 'revert', 'unset']

function stripUnique(item) {
	return {
		...item,
		value: stripValueAnalysis(item.value).value,
	}
}

module.exports = ({ rules }) => {
	const declarations = rules
		.map((rule) => rule.declarations)
		.reduce((all, current) => all.concat(current), [])
	const values = declarations.map((declaration) => declaration.value)

	const uniqueValues = uniqueWithCount(values)

	// Vendor prefixes
	const vendorPrefixes = values.filter((value) => value.stats.isVendorPrefixed)
	const uniqueVendorPrefixes = uniqueWithCount(vendorPrefixes).map(stripUnique)

	// Browserhacks
	const browserhacks = values.filter((value) => value.stats.isBrowserhack)
	const uniqueBrowserhacks = uniqueWithCount(browserhacks).map(stripUnique)

	const textshadows = values
		.filter((value) => value.stats.textshadow)
		.filter((value) => !KEYWORDS.includes(value.value))
	const uniqueTextshadows = uniqueWithCount(textshadows).map(stripUnique)

	// Z-indexes
	const zindexes = values
		.filter((value) => value.stats.zindex)
		.filter((value) => !KEYWORDS.includes(value.value))
	const uniqueZindexes = uniqueWithCount(zindexes).map(stripUnique)

	return [
		{
			id: 'values.total',
			value: values.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'values.totalUnique',
			value: uniqueValues.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'values.prefixed.total',
			value: vendorPrefixes.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'values.prefixed.totalUnique',
			value: uniqueVendorPrefixes.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'values.prefixed.unique',
			value: uniqueVendorPrefixes,
			format: FORMATS.VALUE,
			aggregate: AGGREGATES.LIST,
		},
		{
			id: 'values.prefixed.ratio',
			value: vendorPrefixes.length / values.length,
			format: FORMATS.RATIO,
			aggregate: AGGREGATES.RATIO,
		},
		{
			id: 'values.browserhacks.total',
			value: browserhacks.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'values.browserhacks.totalUnique',
			value: uniqueBrowserhacks.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'values.browserhacks.unique',
			value: uniqueBrowserhacks,
			format: FORMATS.VALUE,
			aggregate: AGGREGATES.LIST,
		},
		{
			id: 'values.browserhacks.ratio',
			value: browserhacks.length / values.length,
			format: FORMATS.RATIO,
			aggregate: AGGREGATES.RATIO,
		},
		{
			id: 'values.textshadows.total',
			value: textshadows.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'values.textshadows.totalUnique',
			value: uniqueTextshadows.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'values.textshadows.unique',
			value: uniqueTextshadows,
			format: FORMATS.VALUE,
			aggregate: AGGREGATES.LIST,
		},
		{
			id: 'values.zindexes.total',
			value: zindexes.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'values.zindexes.totalUnique',
			value: uniqueZindexes.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'values.zindexes.unique',
			value: uniqueZindexes,
			format: FORMATS.VALUE,
			aggregate: AGGREGATES.LIST,
		},
	]
}

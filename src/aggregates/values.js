const { FORMATS, AGGREGATES } = require('./_types')
const { stripValueAnalysis } = require('../analyze')
const uniqueWithCount = require('array-unique-with-count')

function stripUnique(item) {
	return {
		...item,
		value: stripValueAnalysis(item.value).value,
	}
}

module.exports = ({ rules }) => {
	const values = rules
		.map((rule) => rule.declarations)
		.reduce((all, current) => all.concat(current), [])
		.map((declaration) => declaration.value)

	const uniqueValues = uniqueWithCount(values)

	// Vendor prefixes
	const vendorPrefixes = values.filter((p) => p.stats.isVendorPrefixed)
	const uniqueVendorPrefixes = uniqueWithCount(vendorPrefixes).map(stripUnique)

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
	]
}

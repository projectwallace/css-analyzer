const { FORMATS, AGGREGATES } = require('./_types')
const { stripValueAnalysis } = require('../analyze')
const uniqueWithCount = require('array-unique-with-count')

function stripUnique(item) {
	return {
		...item,
		value: stripValueAnalysis(item.value),
	}
}

module.exports = ({ rules }) => {
	const values = rules
		.map((rule) => rule.declarations)
		.reduce((all, current) => all.concat(current), [])
		.map((declaration) => declaration.value)
	const unique = uniqueWithCount(values).map(stripUnique)

	return [
		{
			id: 'values.total',
			value: values.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
	]
}

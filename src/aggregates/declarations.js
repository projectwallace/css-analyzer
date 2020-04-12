const { FORMATS, AGGREGATES } = require('./_types')

module.exports = ({ rules }) => {
	const declarations = rules
		.map((rule) => rule.declarations)
		.reduce((all, current) => all.concat(current), [])

	const unique = new Set(declarations.map((d) => d.key))
	const importants = declarations.filter((d) => d.isImportant)

	return [
		{
			id: 'declarations.total',
			value: declarations.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'declarations.unique.total',
			value: unique.size,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'declarations.unique.ratio',
			value: unique.size / declarations.length,
			format: FORMATS.RATIO,
			aggregate: AGGREGATES.AVERAGE,
		},
		{
			id: 'declarations.important.total',
			value: importants.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'declarations.important.ratio',
			value: importants.length / declarations.length,
			format: FORMATS.RATIO,
			aggregate: AGGREGATES.AVERAGE,
		},
	]
}

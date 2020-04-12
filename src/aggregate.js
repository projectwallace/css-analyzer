const FORMATS = {
	STRING: 'string',
	RATIO: 'ratio',
	FILESIZE: 'filesize',
	COUNT: 'integer',
}

const AGGREGATES = {
	SUM: 'sum',
	AVERAGE: 'average',
	MAX: 'max',
	MIN: 'min',
	LIST: 'list',
}

module.exports = ({ atrules, rules }) => {
	const declarations = rules
		.map((rule) => rule.declarations)
		.reduce((all, current) => all.concat(current), [])

	const unique = new Set(declarations.map((declaration) => declaration.key))
	const importants = declarations.filter(
		(declaration) => declaration.isImportant
	)

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
		},
	].reduce((list, metric) => {
		list[metric.id] = metric
		return list
	}, {})
}

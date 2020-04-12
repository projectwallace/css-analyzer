const { FORMATS, AGGREGATES } = require('./_types')
const { stripRule } = require('../analyze')

module.exports = ({ rules }) => {
	const empty = rules.filter((r) => r.isEmpty)
	const declarations = rules
		.map((rule) => rule.declarations)
		.reduce((all, current) => all.concat(current), [])
	const selectors = rules
		.map((rule) => rule.selectors)
		.reduce((all, current) => all.concat(current), [])

	let maxDeclarationCount = 0
	let rulesWithMostDeclarations = []

	let maxSelectorCount = 0
	let rulesWithMostSelectors = []

	for (let rule of rules) {
		// DECLARATIONS
		const declarationCount = rule.declarations.length

		if (declarationCount > maxDeclarationCount) {
			maxDeclarationCount = declarationCount
			rulesWithMostDeclarations = []
		}

		if (declarationCount === maxDeclarationCount) {
			rulesWithMostDeclarations.push(rule)
		}

		// SELECTORS
		const selectorCount = rule.selectors.length

		if (selectorCount > maxSelectorCount) {
			maxSelectorCount = selectorCount
			rulesWithMostSelectors = []
		}

		if (selectorCount === maxSelectorCount) {
			rulesWithMostSelectors.push(rule)
		}
	}

	return [
		{
			id: 'rules.total',
			value: rules.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'rules.empty.total',
			value: empty.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'rules.empty.ratio',
			value: empty.length / rules.length,
			format: FORMATS.RATIO,
			aggregate: AGGREGATES.AVERAGE,
		},
		{
			id: 'rules.selectors.average',
			value: selectors.length / rules.length,
			format: FORMATS.RATIO,
			aggregate: AGGREGATES.AVERAGE,
		},
		{
			id: 'rules.selectors.maximum.total',
			value: maxSelectorCount,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'rules.selectors.maximum.selectors',
			value: rulesWithMostSelectors.map(stripRule),
			format: FORMATS.SELECTOR,
			aggregate: AGGREGATES.LIST,
		},
		{
			id: 'rules.declarations.average',
			value: declarations.length / rules.length,
			format: FORMATS.RATIO,
			aggregate: AGGREGATES.AVERAGE,
		},
		{
			id: 'rules.declarations.maximum.total',
			value: maxDeclarationCount,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'rules.declarations.maximum.declarations',
			value: rulesWithMostDeclarations.map(stripRule),
			format: FORMATS.DECLARATION,
			aggregate: AGGREGATES.LIST,
		},
	]
}

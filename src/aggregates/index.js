const declarations = require('./declarations')
const stylesheet = require('./stylesheet')
const ruleSets = require('./rules')
const atRules = require('./atrules')
const properties = require('./properties')
const selectors = require('./selectors')

module.exports = ({ atrules, rules, css }) => {
	return []
		.concat(declarations({ css, atrules, rules }))
		.concat(stylesheet({ css, atrules, rules }))
		.concat(ruleSets({ atrules, rules }))
		.concat(selectors({ atrules, rules }))
		.concat(properties({ atrules, rules }))
		.concat(atRules({ atrules }))
		.reduce((list, metric) => {
			list[metric.id] = metric
			return list
		}, {})
}

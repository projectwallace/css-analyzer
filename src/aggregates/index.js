const stylesheet = require('./stylesheet')
const atRules = require('./atrules')
const ruleSets = require('./rules')
const declarations = require('./declarations')
const selectors = require('./selectors')
const properties = require('./properties')
const values = require('./values')

module.exports = ({ atrules, rules, css }) => {
	return []
		.concat(stylesheet({ css, atrules, rules }))
		.concat(atRules({ atrules }))
		.concat(ruleSets({ atrules, rules }))
		.concat(selectors({ atrules, rules }))
		.concat(declarations({ css, atrules, rules }))
		.concat(properties({ atrules, rules }))
		.concat(values({ atrules, rules }))
		.reduce((list, metric) => {
			list[metric.id] = metric
			return list
		}, {})
}

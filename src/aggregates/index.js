const declarations = require('./declarations')
const stylesheet = require('./stylesheet')
const rulez = require('./rules') // ¯\_(ツ)_/¯
const properties = require('./properties')
const selectors = require('./selectors')

module.exports = ({ atrules, rules, css }) => {
	return []
		.concat(declarations({ css, atrules, rules }))
		.concat(stylesheet({ css, atrules, rules }))
		.concat(rulez({ atrules, rules }))
		.concat(selectors({ atrules, rules }))
		.concat(properties({ atrules, rules }))
		.reduce((list, metric) => {
			list[metric.id] = metric
			return list
		}, {})
}

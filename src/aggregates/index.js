const declarations = require('./declarations')
const stylesheet = require('./stylesheet')
const rulez = require('./rules') // ¯\_(ツ)_/¯

module.exports = ({ atrules, rules, css }) => {
	return []
		.concat(declarations({ css, atrules, rules }))
		.concat(stylesheet({ css, atrules, rules }))
		.concat(rulez({ css, atrules, rules }))
		.reduce((list, metric) => {
			list[metric.id] = metric
			return list
		}, {})
}

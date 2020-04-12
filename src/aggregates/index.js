const declarations = require('./declarations')
const stylesheet = require('./stylesheet')

module.exports = ({ atrules, rules, css }) => {
	return []
		.concat(declarations({ css, atrules, rules }))
		.concat(stylesheet({ css, atrules, rules }))
		.reduce((list, metric) => {
			list[metric.id] = metric
			return list
		}, {})
}

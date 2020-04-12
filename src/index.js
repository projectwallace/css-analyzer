const parse = require('./parse')
const analyze = require('./analyze')
const aggregate = require('./aggregates/index')

const defaultOptions = {
	throwOnSyntaxError: false,
}

module.exports = (css, options = defaultOptions) => {
	const parsed = parse(css, { throwOnSyntaxError: options.throwOnSyntaxError })
	const analyzed = analyze(parsed)
	const aggregated = aggregate({ css, ...analyzed })

	return aggregated
}

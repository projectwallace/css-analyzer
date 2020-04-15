const test = require('ava')
const analyze = require('../')

test('does not throw on syntax error', (t) => {
	t.notThrows(() => analyze(`a { color red }`))
	t.notThrows(() => analyze(`a, {}`))
})

test('it throws on syntax errors when we ask it to', (t) => {
	const error = t.throws(
		() => analyze(`a { color red }`, { throwOnSyntaxError: true }),
		{ instanceOf: SyntaxError }
	)

	t.is(error.message, 'Colon is expected')
})

test('every metric has the correct fields', (t) => {
	const actual = analyze(`a {}`)

	function validatePropOnMetric(metric, prop) {
		return metric.hasOwnProperty(prop) && typeof prop !== 'undefined'
	}

	t.true(
		Object.values(actual).every((metric) => validatePropOnMetric(metric, 'id'))
	)
	t.true(
		Object.values(actual).every((metric) =>
			validatePropOnMetric(metric, 'format')
		)
	)
	t.true(
		Object.values(actual).every((metric) =>
			validatePropOnMetric(metric, 'value')
		)
	)
	t.true(
		Object.values(actual).every((metric) =>
			validatePropOnMetric(metric, 'aggregate')
		)
	)
})

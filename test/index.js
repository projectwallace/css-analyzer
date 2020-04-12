const test = require('ava')
const analyze = require('../')

test('does not throw on syntax error', (t) => {
	t.notThrows(() =>
		analyze(`
		a { color red }
	`)
	)

	t.notThrows(() =>
		analyze(`
		{}
	`)
	)
})

test('it throws on syntax errors when we ask it to', (t) => {
	const error = t.throws(
		() =>
			analyze(
				`
		a { color red }
	`,
				{ throwOnSyntaxError: true }
			),
		{ instanceOf: SyntaxError }
	)

	t.is(error.message, 'Colon is expected')
})

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

test('multiple selectors', (t) => {
	const actual = analyze(`
		.h1,
		h2 {
			color: blue;
		}
	`)

	t.deepEqual(
		actual.rules.map((rule) => rule.selectors.map((s) => s.value)).flat(),
		['.h1', 'h2']
	)
})

test('selector list with comments', (t) => {
	const actual = analyze(`
		#a,
		/* COMMENT */
		b {
			color: red;
		}
	`)
	t.deepEqual(
		actual.rules.map((rule) => rule.selectors.map((s) => s.value)).flat(),
		[
			'#a',
			`/* COMMENT */
		b`,
		]
	)
})

test('selector with trailing comma', (t) => {
	const actual = analyze(`
		h1, {
			color: blue;
		}
	`)
	t.deepEqual(
		actual.rules.map((rule) => rule.selectors.map((s) => s.value)).flat(),
		['h1']
	)
})

test('declaration - importants', (t) => {
	const actual = analyze(`
		a {
			color: red;
			color: red !important;
			color:red!important;
			color: red!important;
			color: red    !important;
			content: '!important';
		}

		b{color:red!important}
	`)
		.rules.map((r) => r.declarations)
		.flat()
		.map((d) => d.isImportant)

	const expected = [false, true, true, true, true, false, true]
	t.deepEqual(actual, expected)
})

test('properties', (t) => {
	const actual = analyze(`
		a {
			color: red;
			-webkit-box-shadow: 0 0 0 #000;
			_background: green;
			*zoom: 1;
		}
	`)
		.rules.map((r) => r.declarations)
		.flat()
		.map(({ property }) => property.name)

	t.deepEqual(actual, ['color', '-webkit-box-shadow', '_background', '*zoom'])
})

test('custom properties', (t) => {
	const actual = analyze(`
		a {
			--root: 1em;
			font-size: var(--root);
		}
	`)
		.rules.map((r) => r.declarations)
		.flat()

	t.true(actual[0].property.isCustom)
	t.false(actual[1].property.isCustom)
})

test('rules - empty', (t) => {
	const actual = analyze(`
		a{}
		b { color: red }
	`)

	t.deepEqual(
		actual.rules.map((rule) => rule.declarations.length),
		[0, 1]
	)
})

test('@media', (t) => {
	const actual = analyze(`
		@media (min-width: 320px) {
			a { content: 'a' }
		}

		@media (min-width: 480px and max-width: 640px) {
			b { content: 'b' }
		}

		@media (screen) {
			@media (print) {
				c { content: 'c' }
			}
		}

		@supports (display: grid) {
			@media (min-width: 768px) {
				d { content: 'd' }
			}
		}
	`)

	t.true(actual.atrules.every((atrule) => atrule.declarations.length === 0))
})

test('@keyframes', (t) => {
	const actual = analyze(`
		@keyframes test {
			from {
				top: 0;
			}
			to {
				top: 100%;
			}
		}

		@-webkit-keyframes testWebkit {}

		@media (min-width: 320px) {
			@keyframes jump {}
		}
	`)

	t.true(actual.atrules.every((atrule) => atrule.declarations.length === 0))
})

test('@font-face', (t) => {
	const actual = analyze(`
		@font-face {
			src: url(URL);
			font-family: 'Teko';
		}
	`)

	t.is(actual.atrules[0].declarations.length, 2)
})

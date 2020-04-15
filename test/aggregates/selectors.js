const test = require('ava')
const analyze = require('../../')

test('it reports all selectors', (t) => {
	const actual = analyze(`
		selector1 {
			color: red;
		}

		@supports (test) {
			selector2 {}

			@media (test) {
				selector3 {}
			}
		}

		@keyframes test {
			4% {}
		}

		selector5_with_trailing_comma, {}
	`)

	t.is(actual['selectors.total'].value, 5)
	t.is(actual['selectors.total_unique'].value, 5)
	t.deepEqual(actual['selectors.unique'].value, [
		{ value: 'selector1', count: 1 },
		{ value: 'selector2', count: 1 },
		{ value: 'selector3', count: 1 },
		{ value: '4%', count: 1 }, // keyframe selector
		{ value: 'selector5_with_trailing_comma', count: 1 },
	])
})

test('it reports JS selectors', (t) => {
	const actual = analyze(`
		/* INCLUDE */
		.js-test,
		.js-show,
		.JS-YEAH
		{}

		/* EXCLUDE */
		.no-js,
		regular
		{}
	`)

	t.is(actual['selectors.js.total'].value, 3)
	t.is(actual['selectors.js.total_unique'].value, 3)
	t.is(actual['selectors.js.ratio'].value, 3 / 5)
	t.deepEqual(actual['selectors.js.unique'].value, [
		{ count: 1, value: '.js-test' },
		{ count: 1, value: '.js-show' },
		{ count: 1, value: '.JS-YEAH' },
	])
})

test('it reports ID selectors', (t) => {
	const actual = analyze(`
		/* INCLUDE */
		#WITH_ID,
		.class #id #plus #two,
		element#id
		{}

		/* EXCLUDE */
		.no-id,
		[id="#id"],
		[href='#hash']
		{}
	`)

	t.is(actual['selectors.id.total'].value, 3)
	t.is(actual['selectors.id.total_unique'].value, 3)
	t.is(actual['selectors.id.ratio'].value, 3 / 6)
	t.deepEqual(actual['selectors.id.unique'].value, [
		{ count: 1, value: '#WITH_ID' },
		{ count: 1, value: '.class #id #plus #two' },
		{ count: 1, value: 'element#id' },
	])
})

test('it reports A11Y selectors', (t) => {
	const actual = analyze(`
		/* INCLUDE */
		[aria-hidden],
		img[role="presentation"]
		{}

		/* EXCLUDE */
		[hidden],
		img[loading="lazy"]
		{}
	`)

	t.is(actual['selectors.accessibility.total'].value, 2)
	t.is(actual['selectors.accessibility.total_unique'].value, 2)
	t.is(actual['selectors.accessibility.ratio'].value, 2 / 4)
	t.deepEqual(actual['selectors.accessibility.unique'].value, [
		{ count: 1, value: '[aria-hidden]' },
		{ count: 1, value: 'img[role="presentation"]' },
	])
})

test('it reports universal selectors', (t) => {
	const actual = analyze(`
		/* INCLUDE */
		*,
		.el * .el,
		*::before,
		.el > *,
		* + *
		{}

		/* EXCLUDE */
		[href*="test"]
		{}
	`)

	t.is(actual['selectors.universal.total'].value, 5)
	t.is(actual['selectors.universal.total_unique'].value, 5)
	t.is(actual['selectors.universal.ratio'].value, 5 / 6)
	t.deepEqual(actual['selectors.universal.unique'].value, [
		{ count: 1, value: '*' },
		{ count: 1, value: '.el * .el' },
		{ count: 1, value: '*::before' },
		{ count: 1, value: '.el > *' },
		{ count: 1, value: '* + *' },
	])
})

test('it reports selectors with Browserhacks', (t) => {
	const actual = analyze(`
		/* INCLUDE */
		* html selector,
		:root selector
		{}

		/* EXCLUDE */
		tbody:first-child
		{}
	`)

	t.is(actual['selectors.browserhacks.total'].value, 2)
	t.is(actual['selectors.browserhacks.total_unique'].value, 2)
	t.is(actual['selectors.browserhacks.ratio'].value, 2 / 3)
	t.deepEqual(actual['selectors.browserhacks.unique'].value, [
		{ count: 1, value: '* html selector' },
		{ count: 1, value: ':root selector' },
	])
})

test('it reports selector complexity', (t) => {
	const actual = analyze(`
		a b c,
		a b,
		a b c d,
		a b c d e,
		a b c d e f,
		g h i j k l {}
	`)

	// Maximum
	t.is(actual['selectors.complexity.maximum.value'].value, 6)
	t.is(actual['selectors.complexity.maximum.count'].value, 2)
	t.deepEqual(actual['selectors.complexity.maximum.selectors'].value, [
		{ value: 'a b c d e f', count: 1 },
		{ value: 'g h i j k l', count: 1 },
	])

	t.is(actual['selectors.complexity.average'].value, 26 / 6)
	t.is(actual['selectors.complexity.total'].value, 26)
	t.is(actual['selectors.complexity.total_unique'].value, 5)
	t.deepEqual(actual['selectors.complexity.unique'].value, [
		{ value: 3, count: 1 },
		{ value: 2, count: 1 },
		{ value: 4, count: 1 },
		{ value: 5, count: 1 },
		{ value: 6, count: 2 },
	])
})

test('it reports complexity=1 for broken selectors', (t) => {
	const actual = analyze(`
		+.box-group {}
		.w-(20: 20% {}
	`)
	t.is(actual['selectors.complexity.average'].value, 1)
	t.is(actual['selectors.complexity.total'].value, 2)
	t.is(actual['selectors.complexity.total_unique'].value, 1)
})

test.todo('it reports selector specificity')

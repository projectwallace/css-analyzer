const test = require('ava')
const analyze = require('../../')

test('it counts the total values', (t) => {
	const actual = analyze(`
		selector {
			property1: value1;
			property2: value2;
		}

		@keyframes doNotCount {
			from {
				property3: value3;
			}
			to {
				property4: value4;
			}
		}

		@supports (hover) {
			selector {
				property5: value5;
			}
		}

		@media (print) {
			selector {
				property6: value6;
			}
		}

		@font-face {
			notAProperty: -1;
			src: fake;
		}
	`)

	t.is(actual['values.total'].value, 6)
	t.is(actual['values.totalUnique'].value, 6)
})

test('it analyzes vendor prefixed values', (t) => {
	const fixture = `
		selector {
			background: -webkit-linear-gradient(transparent, transparent);
			background: -moz-linear-gradient(transparent, transparent);
			background: -ms-linear-gradient(transparent, transparent);
			background: -o-linear-gradient(transparent, transparent);

			/* Not prefixed values */
			-webkit-appearance: none;
		}
	`
	const actual = analyze(fixture)

	t.is(actual['values.prefixed.total'].value, 4)
	t.is(actual['values.prefixed.totalUnique'].value, 4)
	t.deepEqual(actual['values.prefixed.unique'].value, [
		{ count: 1, value: '-webkit-linear-gradient(transparent, transparent)' },
		{ count: 1, value: '-moz-linear-gradient(transparent, transparent)' },
		{ count: 1, value: '-ms-linear-gradient(transparent, transparent)' },
		{ count: 1, value: '-o-linear-gradient(transparent, transparent)' },
	])
	t.is(actual['values.prefixed.ratio'].value, 4 / 5)
})

test('it analyzes browserhacks', (t) => {
	const fixture = `
		selector {
			color: red!ie;
			color: red !ie;
			color: red \\\\9;

			/* Not a hack: */
			color: blue;
			color: blue !important;
		}
	`
	const actual = analyze(fixture)

	t.is(actual['values.browserhacks.total'].value, 3)

	// @TODO: these should be 3 unique values, because of
	//        spacing around !ie
	t.is(actual['values.browserhacks.totalUnique'].value, 2)
	t.deepEqual(actual['values.browserhacks.unique'].value, [
		{ count: 2, value: `red!ie` },
		{ count: 1, value: `red \\\\9` },
	])
	t.is(actual['values.browserhacks.ratio'].value, 3 / 5)
})

test('it analyzes z-indexes', (t) => {
	const fixture = `
		selector {
			z-index: 2;
			z-index: 9999;
			z-index: 0;
			z-index: 0; /* duplicate */
			z-index: -1;
			z-index: -100;

			/* Keywords are not included */
			z-index: auto;
		}
	`
	const actual = analyze(fixture)

	t.is(actual['values.zindexes.total'].value, 6)
	t.is(actual['values.zindexes.totalUnique'].value, 5)
	t.deepEqual(actual['values.zindexes.unique'].value, [
		{ count: 1, value: '2' },
		{ count: 1, value: '9999' },
		{ count: 2, value: '0' },
		{ count: 1, value: '-1' },
		{ count: 1, value: '-100' },
	])
})

test('it analyzes text-shadows', (t) => {
	const fixture = `
		selector {
			text-shadow: 1px 1px 2px black;
			text-shadow: #fc0 1px 0 10px;
			text-shadow: 5px 5px #558abb;
			text-shadow: white 2px 5px;
			text-shadow: 5px 10px;
			text-shadow: red 0 -2px;
			text-shadow: 1px 1px 2px black, 0 0 1em blue, 0 0 0.2em blue;

			text-shadow: inherit;
			text-shadow: none;
			text-shadow: initial;
			text-shadow: unset;
		}
	`
	const actual = analyze(fixture)

	t.is(actual['values.textshadows.total'].value, 7)
	t.is(actual['values.textshadows.totalUnique'].value, 7)
	t.deepEqual(actual['values.textshadows.unique'].value, [
		{ count: 1, value: '1px 1px 2px black' },
		{ count: 1, value: '#fc0 1px 0 10px' },
		{ count: 1, value: '5px 5px #558abb' },
		{ count: 1, value: 'white 2px 5px' },
		{ count: 1, value: '5px 10px' },
		{ count: 1, value: 'red 0 -2px' },
		{ count: 1, value: '1px 1px 2px black, 0 0 1em blue, 0 0 0.2em blue' },
	])
})

const test = require('ava')
const analyze = require('../../')

test('it counts the total properties', (t) => {
	const actual = analyze(`
		selector {
			property1: 1;
			property2: 2;
		}

		@keyframes doNotCount {
			from {
				property3: 3;
			}
			to {
				property4: 4;
			}
		}

		@supports (hover) {
			selector {
				property5: 5;
			}
		}

		@media (print) {
			selector {
				property6: 6;
			}
		}

		@font-face {
			notAProperty: -1;
		}
	`)

	t.is(actual['properties.total'].value, 6)
})

test('it finds the unique properties', (t) => {
	const actual = analyze(`
		selector {
			color: red;
			color: red;
			font-size: 1em;
		}
	`)
	t.is(actual['properties.unique.total'].value, 2)
	t.is(actual['properties.unique.ratio'].value, 2 / 3)
	t.deepEqual(actual['properties.unique'].value, [
		{
			count: 2,
			value: { name: 'color' },
		},
		{
			count: 1,
			value: { name: 'font-size' },
		},
	])
})

test('it finds vendor prefixed properties', (t) => {
	const actual = analyze(`
		prefixes {
			-webkit-color: 1;
			-moz-box-shadow: 1;
			-khtml-background: 1;
		}

		notPrefix {
			color: 1;
			--custom: 1;
			-opacity: 1;
		}
	`)

	t.is(actual['properties.prefixed.total'].value, 3)
	t.is(actual['properties.prefixed.ratio'].value, 3 / 6)
	t.is(actual['properties.prefixed.unique.total'].value, 3)
	t.deepEqual(actual['properties.prefixed.unique'].value, [
		{ count: 1, value: { name: '-webkit-color' } },
		{ count: 1, value: { name: '-moz-box-shadow' } },
		{ count: 1, value: { name: '-khtml-background' } },
	])
})

test('it finds properties with browser hacks', (t) => {
	const actual = analyze(`
		hacks {
			*zoom: 1;
			-opacity: 1;
			-OPACITY: 1;
		}

		noHacks {
			color: red;
			--custom-prop: 1;
			-webkit-transform: rotate(1turn);
		}
	`)

	t.is(actual['properties.browserhacks.total'].value, 3)
	t.is(actual['properties.browserhacks.ratio'].value, 3 / 6)
	t.is(actual['properties.browserhacks.unique.total'].value, 3)
	t.deepEqual(actual['properties.browserhacks.unique'].value, [
		{ count: 1, value: { name: '*zoom' } },
		{ count: 1, value: { name: '-opacity' } },
		{ count: 1, value: { name: '-OPACITY' } },
	])
})

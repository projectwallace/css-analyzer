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
})

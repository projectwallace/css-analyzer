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

const test = require('ava')
const analyze = require('../../')

test('it does not throw an error when there are no declarations', (t) => {
	t.notThrows(() => analyze(`a {}`))
})

test('it counts declarations in rules', (t) => {
	const actual = analyze(`
		one {
			color: red;
			color: red !important;
			color:red;
			color:red!important;
		}

		two {
			color: green;
		}
	`)
	t.is(actual['declarations.total'].value, 5)
})

test('it counts declarations in rules, nested in atrules', (t) => {
	const actual = analyze(`
		@media (min-width: 320px) {
			one {
				color: red;
				color: red !important;
				color:red;
				color:red!important;
			}
		}

		@supports (display: grid) {
			two {
				color: green;
			}
		}
	`)
	t.is(actual['declarations.total'].value, 5)
})

test('it does not count atrule descriptors as declarations', (t) => {
	const actual = analyze(`
		rule {
			property: value;
		}

		@font-face {
			src: url(URL);
			font-family: 'TEST';
		}
	`)
	t.is(actual['declarations.total'].value, 1)
})

test('it counts unique declarations', (t) => {
	const actual = analyze(`
		one {
			color: red;
			color: red !important;
			color:red;
			color:red!important;
		}
	`)

	t.is(actual['declarations.unique.total'].value, 2)
})

test('it calculates the ratio of declaration uniqueness', (t) => {
	const actual = analyze(`
		one {
			color: red;
			color: red !important;
			color:red;
			color:red!important;
		}
	`)
	t.is(actual['declarations.unique.ratio'].value, 0.5)
})

test('it counts the total importants', (t) => {
	const actual = analyze(`
		one {
			color: red;
			color: red !important;
			color: red     !important;
			color:red;
			color:red!important;
			content: '!important';
		}
	`)

	t.is(actual['declarations.important.total'].value, 3)
})

test('it calculates the ratio of importants', (t) => {
	const actual = analyze(`
		one {
			color: red;
			color: red !important;
			color:red;
			color:red!important;
		}
	`)

	t.is(actual['declarations.important.ratio'].value, 0.5)
})

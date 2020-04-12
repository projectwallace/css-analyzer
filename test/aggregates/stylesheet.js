const test = require('ava')
const analyze = require('../../')

test('uncompressed filesize', (t) => {
	const actual = analyze(`a{}`)

	t.is(actual['stylesheet.filesize.uncompressed.bytes'].value, 3)
})

test('compressed filesize: gzip', (t) => {
	const actual = analyze(`
		one {
			dec1: val1;
			dec2: val2;
		}

		two {
			dec1: val1;
			dec2: val2;
		}
	`)

	t.is(actual['stylesheet.filesize.compressed.gzip.bytes'].value, 60)
	t.is(
		actual['stylesheet.filesize.compressed.gzip.compressionRatio'].value,
		0.6896551724137931
	)
})

test('it counts the lines of code', (t) => {
	const actual = analyze(`
		one {
			onePointOne: 1.1;
		}

		two {}
		three {}

		@media (min-width: 0) {
			four {
				fourPointOne: 4.1;
			}
		}
	`)

	t.is(actual['stylesheet.linesofcode.total'].value, 14)
})

// First: implement sloc for all underlying metrics
test.todo('it counts the source lines of code')

// First: implement underlying metrics
test.todo('it counts the total of browserhacks')
test.todo('it counts the amount of unique browserhacks')

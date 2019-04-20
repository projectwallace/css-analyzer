const test = require('ava')
const analyze = require('../../../src/analyzer/stylesheets/size')

const FIXTURE = `
	html {
		color: red;
		font-size: 1em;
	}

	body {
		background-color: green;
	}

	@supports (color: red) {
		main {
			color: red;
		}
	}
`
let actual
test.beforeEach(() => {
  actual = analyze(FIXTURE)
})
test.afterEach(() => {
  actual = undefined
})

test('it calculates uncompressed size', t => {
  t.is(actual.uncompressed.totalBytes, 141)
})

test('it calculates compressed size with gzip', t => {
  t.is(actual.compressed.gzip.totalBytes, 116)
})

test('it calculates the compression ratio of gzip', t => {
  t.is(actual.compressed.gzip.compressionRatio, 0.17730496453900713)
})

test('it calculates compressed size with brotli', t => {
  t.is(actual.compressed.brotli.totalBytes, 80)
})

test('it calculates the compression ratio of brotli', t => {
  t.is(actual.compressed.brotli.compressionRatio, 0.43262411347517726)
})

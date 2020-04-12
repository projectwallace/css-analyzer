const gzipSize = require('gzip-size')
const splitLines = require('split-lines')

const { FORMATS, AGGREGATES } = require('./_types')

module.exports = ({ css, atrules, rules }) => {
	const rawBytesSize = Buffer.byteLength(css, 'utf8')
	const gzipBytesSize = gzipSize.sync(css)

	return [
		{
			id: 'stylesheet.filesize.uncompressed.bytes',
			value: rawBytesSize,
			format: FORMATS.FILESIZE,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'stylesheet.filesize.compressed.gzip.bytes',
			value: gzipBytesSize,
			format: FORMATS.FILESIZE,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'stylesheet.filesize.compressed.gzip.compressionRatio',
			value: gzipBytesSize / rawBytesSize,
			format: FORMATS.RATIO,
			aggregate: AGGREGATES.AVERAGE,
		},
		{
			id: 'stylesheet.browserhacks.total',
			value: void 0,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'stylesheet.browserhacks.unique.total',
			value: void 0,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'stylesheet.linesofcode.total',
			value: splitLines(css).length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'stylesheet.sourcelinesofcode.total',
			value: void 0,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
	]
}

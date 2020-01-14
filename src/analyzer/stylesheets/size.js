const gzipSize = require('gzip-size')

function getCompressionRatio(rawSize, compressedSize) {
  if (rawSize === 0 || compressedSize === 0) {
    return 0
  }

  // eslint-disable-next-line no-mixed-operators
  return 1 - compressedSize / rawSize
}

module.exports = rawCss => {
  const rawBytes = Buffer.byteLength(rawCss, 'utf8')
  const gzipBytes = gzipSize.sync(rawCss)

  return {
    uncompressed: {
      totalBytes: rawBytes
    },
    compressed: {
      gzip: {
        totalBytes: gzipBytes,
        compressionRatio: getCompressionRatio(rawBytes, gzipBytes)
      }
    }
  }
}

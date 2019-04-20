const test = require('ava')
const analyze = require('../../../src/analyzer/stylesheets')

const FIXTURE = {
  rawCss: '',
  selectors: {
    total: 0,
    browserhacks: {total: 0, totalUnique: 0}
  },
  declarations: {total: 0},
  atrules: {
    mediaqueries: {browserhacks: {total: 0, totalUnique: 0}},
    supports: {browserhacks: {total: 0, totalUnique: 0}}
  },
  properties: {browserhacks: {total: 0, totalUnique: 0}},
  values: {browserhacks: {total: 0, totalUnique: 0}}
}

test('it responds with the correct structure', t => {
  t.deepEqual(analyze(FIXTURE), {
    size: 0,
    filesize: {
      uncompressed: {
        totalBytes: 0
      },
      compressed: {
        gzip: {
          totalBytes: 20,
          compressionRatio: 0
        },
        brotli: {
          totalBytes: 1,
          compressionRatio: 0
        }
      }
    },
    simplicity: 0,
    cohesion: {
      average: 0
    },
    browserhacks: {
      total: 0,
      totalUnique: 0
    }
  })
})

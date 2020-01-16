const test = require('ava')
const analyze = require('../../../src/analyzer/stylesheets')

const FIXTURE = {
  rawCss: '',
  rules: [],
  selectors: {
    total: 0,
    browserhacks: {total: 0, totalUnique: 0}
  },
  atrules: {
    mediaqueries: {browserhacks: {total: 0, totalUnique: 0}},
    supports: {browserhacks: {total: 0, totalUnique: 0}}
  },
  properties: {browserhacks: {total: 0, totalUnique: 0}},
  values: {browserhacks: {total: 0, totalUnique: 0}},
  css: {
    atRules: [],
    selectors: [],
    declarations: []
  }
}

test('it responds with the correct structure', t => {
  t.deepEqual(analyze(FIXTURE), {
    size: {
      uncompressed: {
        totalBytes: 0
      },
      compressed: {
        gzip: {
          totalBytes: 20,
          compressionRatio: 0
        }
      }
    },
    simplicity: 0,
    cohesion: {
      average: 0,
      min: {
        count: 0,
        value: null
      }
    },
    browserhacks: {
      total: 0,
      totalUnique: 0
    },
    linesOfCode: {total: 1, sourceLinesOfCode: {total: 0}}
  })
})

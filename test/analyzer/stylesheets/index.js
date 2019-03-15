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

test('it reports the filesize correctly', t => {
  const {size: actual} = analyze({...FIXTURE, rawCss: 'html {}'})
  t.is(actual, 7)
})

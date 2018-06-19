const test = require('ava')
const analyzer = require('../..')

test('Breaks with invalid CSS', async t => {
  await t.throws(analyzer('INVALID CSS'))
})

test('Passes with valid CSS', async t => {
  await t.notThrows(analyzer('body {}'))
})

test('Returns the correct analysis object structure', async t => {
  const actual = await analyzer('foo{}')
  const expected = {
    atrules: {
      charsets: {
        total: 0,
        totalUnique: 0,
        unique: []
      },
      documents: {
        total: 0,
        totalUnique: 0,
        unique: []
      },
      fontfaces: {
        total: 0,
        totalUnique: 0,
        unique: []
      },
      imports: {
        total: 0,
        totalUnique: 0,
        unique: []
      },
      keyframes: {
        total: 0,
        totalUnique: 0,
        unique: []
      },
      mediaqueries: {
        total: 0,
        totalUnique: 0,
        unique: []
      },
      namespaces: {
        total: 0,
        totalUnique: 0,
        unique: []
      },
      pages: {
        total: 0,
        totalUnique: 0,
        unique: []
      },
      supports: {
        total: 0,
        totalUnique: 0,
        unique: []
      }
    },
    declarations: {
      importants: {
        share: 0,
        total: 0
      },
      total: 0,
      totalUnique: 0
    },
    properties: {
      prefixed: {
        share: 0,
        total: 0,
        totalUnique: 0,
        unique: []
      },
      total: 0,
      totalUnique: 0,
      unique: []
    },
    rules: {
      total: 1
    },
    selectors: {
      accessibility: {
        total: 0,
        totalUnique: 0,
        unique: []
      },
      id: {
        total: 0,
        totalUnique: 0,
        unique: []
      },
      identifiers: {
        average: 1,
        top: [
          {
            identifiers: 1,
            selector: 'foo'
          }
        ]
      },
      js: {
        total: 0,
        totalUnique: 0,
        unique: []
      },
      specificity: {
        top: [
          {
            selector: 'foo',
            specificity: {
              a: 0,
              b: 0,
              c: 0,
              d: 1
            }
          }
        ]
      },
      total: 1,
      totalUnique: 1,
      universal: {
        total: 0,
        totalUnique: 0,
        unique: []
      }
    },
    stylesheets: {
      cohesion: {
        average: 0
      },
      simplicity: 1,
      size: 5
    },
    values: {
      colors: {
        total: 0,
        totalUnique: 0,
        unique: []
      },
      fontfamilies: {
        total: 0,
        totalUnique: 0,
        unique: []
      },
      fontsizes: {
        total: 0,
        totalUnique: 0,
        unique: []
      },
      prefixed: {
        share: 0,
        total: 0,
        totalUnique: 0,
        unique: []
      },
      total: 0
    }
  }

  t.deepEqual(actual, expected)
})

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
        unique: [],
        uniqueWithCount: []
      },
      documents: {
        total: 0,
        totalUnique: 0,
        unique: [],
        uniqueWithCount: []
      },
      fontfaces: {
        total: 0,
        totalUnique: 0,
        unique: [],
        uniqueWithCount: []
      },
      imports: {
        total: 0,
        totalUnique: 0,
        unique: [],
        uniqueWithCount: []
      },
      keyframes: {
        total: 0,
        totalUnique: 0,
        unique: [],
        uniqueWithCount: []
      },
      mediaqueries: {
        total: 0,
        totalUnique: 0,
        unique: [],
        uniqueWithCount: []
      },
      namespaces: {
        total: 0,
        totalUnique: 0,
        unique: [],
        uniqueWithCount: []
      },
      pages: {
        total: 0,
        totalUnique: 0,
        unique: [],
        uniqueWithCount: []
      },
      supports: {
        total: 0,
        totalUnique: 0,
        unique: [],
        uniqueWithCount: []
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
        unique: [],
        uniqueWithCount: []
      },
      total: 0,
      totalUnique: 0,
      unique: [],
      uniqueWithCount: []
    },
    rules: {
      total: 1
    },
    selectors: {
      id: {
        total: 0,
        totalUnique: 0,
        unique: [],
        uniqueWithCount: []
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
        unique: [],
        uniqueWithCount: []
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
        unique: [],
        uniqueWithCount: []
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
        unique: [],
        uniqueWithCount: []
      },
      fontfamilies: {
        total: 0,
        totalUnique: 0,
        unique: [],
        uniqueWithCount: []
      },
      fontsizes: {
        total: 0,
        totalUnique: 0,
        unique: [],
        uniqueWithCount: []
      },
      prefixed: {
        share: 0,
        total: 0,
        totalUnique: 0,
        unique: [],
        uniqueWithCount: []
      },
      total: 0
    }
  }

  t.deepEqual(actual, expected)
})

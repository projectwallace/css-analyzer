import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { analyze, compareSpecificity } from './index.js'

const Api = suite('Public API')

Api('exposes the analyze method', () => {
  assert.is(typeof analyze, 'function')
})

Api('exposes the compareSpecificity method', () => {
  assert.is(typeof compareSpecificity, 'function')
})

Api('does not break on CSS Syntax Errors', () => {
  assert.not.throws(() => analyze('test, {}'))
  assert.not.throws(() => analyze('test { color red }'))
})

Api('handles empty input gracefully', () => {
  const actual = analyze('')
  delete actual.__meta__
  const expected = {
    "stylesheet": {
      "sourceLinesOfCode": 0,
      "linesOfCode": 1,
      "size": 0,
      "comments": {
        "total": 0,
        "size": 0
      },
      "embeddedContent": {
        "total": 0,
        "totalUnique": 0,
        "unique": {},
        "uniquenessRatio": 0,
        "size": {
          "total": 0,
          "ratio": 0
        }
      }
    },
    "atrules": {
      "fontface": {
        "total": 0,
        "totalUnique": 0,
        "unique": [],
        "uniquenessRatio": 0
      },
      "import": {
        "total": 0,
        "totalUnique": 0,
        "unique": {},
        "uniquenessRatio": 0
      },
      "media": {
        "total": 0,
        "totalUnique": 0,
        "unique": {},
        "uniquenessRatio": 0
      },
      "charset": {
        "total": 0,
        "totalUnique": 0,
        "unique": {},
        "uniquenessRatio": 0
      },
      "supports": {
        "total": 0,
        "totalUnique": 0,
        "unique": {},
        "uniquenessRatio": 0
      },
      "keyframes": {
        "total": 0,
        "totalUnique": 0,
        "unique": {},
        "uniquenessRatio": 0,
        "prefixed": {
          "total": 0,
          "totalUnique": 0,
          "unique": {},
          "uniquenessRatio": 0,
          "ratio": 0
        }
      },
      "container": {
        "total": 0,
        "totalUnique": 0,
        "unique": {},
        "uniquenessRatio": 0
      },
      "layer": {
        "total": 0,
        "totalUnique": 0,
        "unique": {},
        "uniquenessRatio": 0
      }
    },
    "rules": {
      "total": 0,
      "empty": {
        "total": 0,
        "ratio": 0,
      },
      "sizes": {
        "min": 0,
        "max": 0,
        "mean": 0,
        "mode": 0,
        "median": 0,
        "range": 0,
        "sum": 0,
        "items": [],
        "unique": {},
        "totalUnique": 0,
        "uniquenessRatio": 0,
      },
      "selectors": {
        "min": 0,
        "max": 0,
        "mean": 0,
        "mode": 0,
        "median": 0,
        "range": 0,
        "sum": 0,
        "items": [],
        "unique": {},
        "totalUnique": 0,
        "uniquenessRatio": 0,
      },
      "declarations": {
        "min": 0,
        "max": 0,
        "mean": 0,
        "mode": 0,
        "median": 0,
        "range": 0,
        "sum": 0,
        "items": [],
        "unique": {},
        "totalUnique": 0,
        "uniquenessRatio": 0,
      }
    },
    "selectors": {
      "total": 0,
      "totalUnique": 0,
      "uniquenessRatio": 0,
      "specificity": {
        "min": [0, 0, 0],
        "max": [0, 0, 0],
        "sum": [
          0,
          0,
          0,
        ],
        "mean": [
          0,
          0,
          0,
        ],
        "mode": [
          0,
          0,
          0,
        ],
        "median": [
          0,
          0,
          0,
        ],
        "items": [],
        "unique": {},
        "totalUnique": 0,
        "uniquenessRatio": 0,
      },
      "complexity": {
        "min": 0,
        "max": 0,
        "mean": 0,
        "mode": 0,
        "median": 0,
        "range": 0,
        "sum": 0,
        "total": 0,
        "totalUnique": 0,
        "unique": {},
        "uniquenessRatio": 0,
        "items": []
      },
      "id": {
        "total": 0,
        "totalUnique": 0,
        "unique": {},
        "uniquenessRatio": 0,
        "ratio": 0
      },
      "accessibility": {
        "total": 0,
        "totalUnique": 0,
        "unique": {},
        "uniquenessRatio": 0,
        "ratio": 0
      },
      "keyframes": {
        "total": 0,
        "totalUnique": 0,
        "unique": {},
        "uniquenessRatio": 0
      }
    },
    "declarations": {
      "total": 0,
      "totalUnique": 0,
      "uniquenessRatio": 0,
      "unique": {
        "total": 0,
        "ratio": 0
      },
      "importants": {
        "total": 0,
        "ratio": 0,
        "inKeyframes": {
          "total": 0,
          "ratio": 0
        }
      }
    },
    "properties": {
      "total": 0,
      "totalUnique": 0,
      "unique": {},
      "uniquenessRatio": 0,
      "prefixed": {
        "total": 0,
        "totalUnique": 0,
        "unique": {},
        "uniquenessRatio": 0,
        "ratio": 0
      },
      "custom": {
        "total": 0,
        "totalUnique": 0,
        "unique": {},
        "uniquenessRatio": 0,
        "ratio": 0
      },
      "browserhacks": {
        "total": 0,
        "totalUnique": 0,
        "unique": {},
        "uniquenessRatio": 0,
        "ratio": 0
      },
      "complexity": {
        "min": 0,
        "max": 0,
        "mean": 0,
        "mode": 0,
        "median": 0,
        "range": 0,
        "sum": 0,
      }
    },
    "values": {
      "colors": {
        "total": 0,
        "totalUnique": 0,
        "unique": {},
        "uniquenessRatio": 0,
        "itemsPerContext": {}
      },
      "fontFamilies": {
        "total": 0,
        "totalUnique": 0,
        "unique": {},
        "uniquenessRatio": 0
      },
      "fontSizes": {
        "total": 0,
        "totalUnique": 0,
        "unique": {},
        "uniquenessRatio": 0
      },
      "zindexes": {
        "total": 0,
        "totalUnique": 0,
        "unique": {},
        "uniquenessRatio": 0
      },
      "textShadows": {
        "total": 0,
        "totalUnique": 0,
        "unique": {},
        "uniquenessRatio": 0
      },
      "boxShadows": {
        "total": 0,
        "totalUnique": 0,
        "unique": {},
        "uniquenessRatio": 0
      },
      "animations": {
        "durations": {
          "total": 0,
          "totalUnique": 0,
          "unique": {},
          "uniquenessRatio": 0
        },
        "timingFunctions": {
          "total": 0,
          "totalUnique": 0,
          "unique": {},
          "uniquenessRatio": 0
        }
      },
      "prefixes": {
        "total": 0,
        "totalUnique": 0,
        "unique": {},
        "uniquenessRatio": 0
      },
      "browserhacks": {
        "total": 0,
        "totalUnique": 0,
        "unique": {},
        "uniquenessRatio": 0
      },
      "units": {
        "total": 0,
        "totalUnique": 0,
        "unique": {},
        "uniquenessRatio": 0,
        "itemsPerContext": {}
      }
    },
  }

  assert.equal(actual, expected)
})

Api('has metadata', () => {
  const fixture = Array.from({ length: 10 }).map(_ => `
    html {
      font: 1em/1 sans-serif;
      color: rgb(0 0 0 / 0.5);
    }

    @media screen {
      @supports (display: grid) {
        test::after :where(test) :is(done) {
          display: grid;
          color: #f00;
        }
      }
    }
  `).join('')

  const result = analyze(fixture)
  const actual = result.__meta__

  assert.type(actual.parseTime, 'number')
  assert.ok(actual.parseTime > 0, `expected parseTime to be bigger than 0, got ${actual.parseTime}`)

  assert.type(actual.analyzeTime, 'number')
  assert.ok(actual.analyzeTime > 0, `expected analyzeTime to be bigger than 0, got ${actual.parseTime}`)

  assert.type(actual.total, 'number')
  assert.ok(actual.total > 0, `expected total time to be bigger than 0, got ${actual.parseTime}`)
})

Api.run()
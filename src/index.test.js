import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { analyze, compareSpecificity } from './index.js'
import { readFileSync } from 'fs'

const fixtures = [
  'bol-com-20190617.css',
  'css-tricks-20190319.css',
  'facebook-20190319.css',
  'gazelle-20210905.css',
  'github-20210501.css',
  'lego-20190617.css',
  'smashing-magazine-20190319.css',
  'trello-20190617.css',
].map(fileName => {
  const css = readFileSync(`./src/__fixtures__/${fileName}`, 'utf-8')
  return {
    css,
    fileName
  }
})

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
        "ratio": 0
      },
      "selectors": {
        "min": 0,
        "max": 0,
        "mean": 0,
        "mode": 0,
        "median": 0,
        "range": 0,
        "sum": 0,
        "items": []
      },
      "declarations": {
        "min": 0,
        "max": 0,
        "mean": 0,
        "mode": 0,
        "median": 0,
        "range": 0,
        "sum": 0,
        "items": []
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
          0
        ],
        "mean": [
          0,
          0,
          0
        ],
        "mode": [
          0,
          0,
          0
        ],
        "median": [
          0,
          0,
          0
        ],
        "items": []
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

Api.run()
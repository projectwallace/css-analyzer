# CSS Analyzer

<div align="center">
  <img src="logo.svg" height="160" width="160" alt="Analyzer logo">
</div>

<div align="center">
  <a href="https://npmjs.org/package/@projectwallace/css-analyzer">
    <img src="https://badgen.net/npm/v/@projectwallace/css-analyzer" alt="version" />
  </a>
  <a href="https://npmjs.org/package/@projectwallace/css-analyzer">
    <img src="https://badgen.now.sh/npm/dm/@projectwallace/css-analyzer" alt="downloads" />
  </a>
  <a href="https://packagephobia.com/result?p=%40projectwallace%2Fcss-analyzer">
    <img src="https://packagephobia.com/badge?p=%40projectwallace%2Fcss-analyzer" alt="install size" />
  </a>
</div>

<div align="center">
A <b>CSS analyzer</b> that goes through your CSS to find all kinds of relevant statistics.
</div>

## Features

* Extremely **detailed** (150+ metrics)
* Super **[fast](/benchmark)**
* Supports both NodeJS and browsers

## Install

```sh
npm install @projectwallace/css-analyzer
```

## Usage

### Analyzing CSS

```js
import { analyze } from '@projectwallace/css-analyzer'

const result = analyze(`
	p {
		color: blue;
		font-size: 100%;
	}

	.component[data-state="loading"] {
		background-color: whitesmoke;
	}
`)
```
<details>
  <summary>More examples output can be found in <a href="src/__fixtures__">the fixtures folder</a> and looks roughly like this:</summary>

```json
{
  "stylesheet": {
    "sourceLinesOfCode": 5,
    "linesOfCode": 8,
    "size": 113,
    "comments": {
      "total": 0,
      "size": 0
    }
  },
  "atrules": {
    "fontface": {
      "total": 0,
      "totalUnique": 0,
      "unique": [],
      "uniquenessRatio": 1
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
        "ratio": null
      }
    },
    "container": {
      "total": 0,
      "totalUnique": 0,
      "unique": {},
      "uniquenessRatio": 0
    }
  },
  "rules": {
    "total": 2,
    "empty": {
      "total": 0,
      "ratio": 0
    },
    "selectors": {
      "min": 1,
      "max": 1,
      "mean": 1,
      "mode": 1,
      "median": 1,
      "range": 0,
      "sum": 2,
      "items": [
        1,
        1
      ]
    },
    "declarations": {
      "min": 1,
      "max": 2,
      "mean": 1.5,
      "mode": 1.5,
      "median": 1.5,
      "range": 1,
      "sum": 3,
      "items": [
        2,
        1
      ]
    }
  },
  "selectors": {
    "total": 2,
    "totalUnique": 2,
    "uniquenessRatio": 1,
    "specificity": {
      "sum": [
        0,
        2,
        1
      ],
      "min": [
        0,
        0,
        1
      ],
      "max": [
        0,
        2,
        0
      ],
      "mean": [
        0,
        1,
        0.5
      ],
      "mode": [
        0,
        1,
        0.5
      ],
      "median": [
        0,
        1,
        0.5
      ],
      "items": [
        [
          0,
          0,
          1
        ],
        [
          0,
          2,
          0
        ]
      ]
    },
    "complexity": {
      "min": 1,
      "max": 3,
      "mean": 2,
      "mode": 2,
      "median": 2,
      "range": 2,
      "sum": 4,
      "total": 2,
      "totalUnique": 2,
      "unique": {
        "1": 1,
        "3": 1
      },
      "uniquenessRatio": 1,
      "items": [
        1,
        3
      ]
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
      "uniquenessRatio": 0,
      "ratio": 0
    }
  },
  "declarations": {
    "total": 3,
    "unique": {
      "total": 3,
      "ratio": 1
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
    "total": 3,
    "totalUnique": 3,
    "unique": {
      "color": 1,
      "font-size": 1,
      "background-color": 1
    },
    "uniquenessRatio": 1,
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
      "total": 2,
      "totalUnique": 2,
      "unique": {
        "blue": 1,
        "whitesmoke": 1
      },
      "uniquenessRatio": 1,
      "itemsPerContext": {
        "color": {
          "total": 1,
          "totalUnique": 1,
          "unique": {
            "blue": 1
          },
          "uniquenessRatio": 1
        },
        "background-color": {
          "total": 1,
          "totalUnique": 1,
          "unique": {
            "whitesmoke": 1
          },
          "uniquenessRatio": 1
        }
      }
    },
    "fontFamilies": {
      "total": 0,
      "totalUnique": 0,
      "unique": {},
      "uniquenessRatio": 0
    },
    "fontSizes": {
      "total": 1,
      "totalUnique": 1,
      "unique": {
        "100%": 1
      },
      "uniquenessRatio": 1
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
  "__meta__": {
    "parseTime": 4,
    "analyzeTime": 5,
    "total": 10
  }
}
```
</details>

### Comparing specificity

```js
import { compareSpecificity } from '@projectwallace/css-analyzer'

const result = [
  [0,1,1],
  [2,0,0],
  [0,0,1],
].sort((a, b) => compareSpecificity(a, b))

// => result:
// [
//   [2,0,0],
//   [0,1,1],
//   [0,0,1],
// ]

const isSpecificityEqual = compareSpecificity(
  [0,1,0],
  [0,1,0]
) === 0
// => isSpecificityEqual: true
```

## Related projects

- [CSS Code Quality Analyzer](https://github.com/projectwallace/css-code-quality) - 
  A Code Quality analyzer that tells you how maintainable, complex and performant your CSS is
- [Wallace CLI](https://github.com/projectwallace/wallace-cli) - CLI tool for
  @projectwallace/css-analyzer
- [Constyble](https://github.com/projectwallace/constyble) - CSS Complexity linter
- [Color Sorter](https://github.com/projectwallace/color-sorter) - Sort CSS colors
  by hue, saturation, lightness and opacity
- [CSS Diff Github Action](https://github.com/projectwallace/css-diff-action) - A
  GitHub action that comments on your PR to tell you how your code quality has changed

# css-analyzer [![Build Status](https://travis-ci.org/projectwallace/css-analyzer.svg?branch=master)](https://travis-ci.org/projectwallace/css-analyzer) [![Known Vulnerabilities](https://snyk.io/test/github/projectwallace/css-analyzer/badge.svg)](https://snyk.io/test/github/projectwallace/css-analyzer) [![Coverage Status](https://coveralls.io/repos/github/projectwallace/css-analyzer/badge.svg?branch=master)](https://coveralls.io/github/projectwallace/css-analyzer?branch=master) ![Dependencies Status](https://img.shields.io/david/projectwallace/css-analyzer.svg) ![Dependencies Status](https://img.shields.io/david/dev/projectwallace/css-analyzer.svg) [![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)

> Analyze your CSS

A module that goes through your CSS to find all kinds of relevant statistics,
like the amount of rules, the amount of `!important`s, unique colors, and so on.

## Install

```sh
npm install --save @projectwallace/css-analyzer
```

or

```sh
yarn add @projectwallace/css-analyzer
```

## Usage

```js
const analyze = require('css-analyzer');

analyze('foo {}')
  .then(result => console.log(result))
  .catch(err => console.error(err))
}

//=>
// {
//   atrules: {
//     charsets: {
//       total: 0,
//       totalUnique: 0,
//       unique: []
//     },
//     documents: {
//       total: 0,
//       totalUnique: 0,
//       unique: []
//     },
//     fontfaces: {
//       total: 0,
//       totalUnique: 0,
//       unique: []
//     },
//     imports: {
//       total: 0,
//       totalUnique: 0,
//       unique: []
//     },
//     keyframes: {
//       total: 0,
//       totalUnique: 0,
//       unique: []
//     },
//     mediaqueries: {
//       total: 0,
//       totalUnique: 0,
//       unique: []
//     },
//     namespaces: {
//       total: 0,
//       totalUnique: 0,
//       unique: []
//     },
//     pages: {
//       total: 0,
//       totalUnique: 0,
//       unique: []
//     },
//     supports: {
//       total: 0,
//       totalUnique: 0,
//       unique: []
//     }
//   },
//   declarations: {
//     importants: {
//       share: 0,
//       total: 0
//     },
//     total: 0,
//     totalUnique: 0
//   },
//   properties: {
//     prefixed: {
//       share: 0,
//       total: 0,
//       totalUnique: 0,
//       unique: []
//     },
//     total: 0,
//     totalUnique: 0,
//     unique: []
//   },
//   rules: {
//     total: 1,
//     empty: {
//       total: 1
//     }
//   },
//   selectors: {
//     accessibility: {
//       total: 0,
//       totalUnique: 0,
//       unique: []
//     },
//     id: {
//       total: 0,
//       totalUnique: 0,
//       unique: []
//     },
//     identifiers: {
//       average: 1,
//       top: [
//         {
//           identifiers: 1,
//           selector: 'foo'
//         }
//       ]
//     },
//     js: {
//       total: 0,
//       totalUnique: 0,
//       unique: []
//     },
//     specificity: {
//       top: [
//         {
//           selector: 'foo',
//           specificity: {
//             a: 0,
//             b: 0,
//             c: 0,
//             d: 1
//           }
//         }
//       ]
//     },
//     total: 1,
//     totalUnique: 1,
//     universal: {
//       total: 0,
//       totalUnique: 0,
//       unique: []
//     }
//   },
//   stylesheets: {
//     cohesion: {
//       average: 0
//     },
//     simplicity: 1,
//     size: 5
//   },
//   values: {
//     colors: {
//       total: 0,
//       totalUnique: 0,
//       unique: [],
//       duplicates: []
//     },
//     fontfamilies: {
//       total: 0,
//       totalUnique: 0,
//       unique: []
//     },
//     fontsizes: {
//       total: 0,
//       totalUnique: 0,
//       unique: []
//     },
//     prefixed: {
//       share: 0,
//       total: 0,
//       totalUnique: 0,
//       unique: []
//     },
//     total: 0
//   }
// }
```

## Related projects

- [Wallace](https://github.com/bartveneman/wallace-cli) - CLI tool for
  @projectwallace/css-analyzer
- [CSS Analyzer Diff](https://github.com/bartveneman/css-analyzer-diff) -
  Calculates the diff between two sets of CSS analysis
- [Gromit](https://github.com/bartveneman/gromit-cli) - A test framework to assert
  that CSS doesn't exceeds certain thresholds
- [Color Sorter](https://github.com/bartveneman/color-sorter) - Sort CSS colors
  by hue, saturation, lightness and opacity

# css-analyzer [![Build Status](https://travis-ci.org/projectwallace/css-analyzer.svg?branch=master)](https://travis-ci.org/projectwallace/css-analyzer) [![Known Vulnerabilities](https://snyk.io/test/github/projectwallace/css-analyzer/badge.svg)](https://snyk.io/test/github/projectwallace/css-analyzer) [![Coverage Status](https://coveralls.io/repos/github/projectwallace/css-analyzer/badge.svg?branch=master)](https://coveralls.io/github/projectwallace/css-analyzer?branch=master)

> Analyze your CSS completely

A module that goes through your CSS to find all kinds of relevant statistics,
like the amount of rules, the amount of `!important`s, unique colors, and so on.

<a target='_blank' rel='nofollow' href='https://app.codesponsor.io/link/cYZvdCsHXAu8TdZM9qjjz3MH/projectwallace/css-analyzer'>
  <img alt='Sponsor' width='888' height='68' src='https://app.codesponsor.io/embed/cYZvdCsHXAu8TdZM9qjjz3MH/projectwallace/css-analyzer.svg' />
</a>


## Install

```
$ npm install --save projectwallace/css-analyzer
```

or

```
$ yarn install projectwallace/css-analyzer
```


## Usage

```js
const analyze = require('css-analyzer');

analyze('body{color:red}')
  .then(result => {
    console.log(result)
  })

//=>
// {
//   "stylesheets": {
//     "size": 15,
//     "simplicity": 1,
//     "cohesion": {
//       "average": 1
//     }
//   },
//   "charsets": {
//     "total": 0,
//     "unique": [],
//     "totalUnique": 0
//   },
//   "documents": {
//     "total": 0,
//     "unique": [],
//     "totalUnique": 0
//   },
//   "fontfaces": {
//     "total": 0
//   },
//   "imports": {
//     "total": 0,
//     "unique": [],
//     "totalUnique": 0
//   },
//   "keyframes": {
//     "total": 0,
//     "unique": [],
//     "totalUnique": 0
//   },
//   "mediaqueries": {
//     "total": 0,
//     "unique": [],
//     "totalUnique": 0
//   },
//   "namespaces": {
//     "total": 0,
//     "unique": [],
//     "totalUnique": 0
//   },
//   "pages": {
//     "total": 0,
//     "unique": [],
//     "totalUnique": 0
//   },
//   "supports": {
//     "total": 0,
//     "unique": [],
//     "totalUnique": 0
//   },
//   "rules": {
//     "total": 1
//   },
//   "selectors": {
//     "total": 1,
//     "totalUnique": 1,
//     "js": {
//       "total": 0,
//       "unique": [],
//       "totalUnique": 0
//     },
//     "id": {
//       "total": 0,
//       "unique": [],
//       "totalUnique": 0
//     },
//     "universal": {
//       "total": 0,
//       "unique": [],
//       "totalUnique": 0
//     },
//     "specificity": {
//       "top": [
//         {
//           "selector": "body",
//           "specificity": {
//             "a": 0,
//             "b": 0,
//             "c": 0,
//             "d": 1
//           }
//         }
//       ]
//     }
//   },
//   "declarations": {
//     "total": 1,
//     "totalUnique": 1,
//     "importants": {
//       "total": 0,
//       "share": 0
//     }
//   },
//   "properties": {
//     "total": 1,
//     "unique": [
//       "color"
//     ],
//     "totalUnique": 1,
//     "prefixed": {
//       "total": 0,
//       "unique": [],
//       "totalUnique": 0,
//       "share": 0
//     }
//   },
//   "values": {
//     "total": 1,
//     "prefixed": {
//       "total": 0,
//       "unique": [],
//       "totalUnique": 0,
//       "share": 0
//     },
//     "fontsizes": {
//       "total": 0,
//       "unique": [],
//       "totalUnique": 0
//     },
//     "fontfamilies": {
//       "total": 0,
//       "unique": [],
//       "totalUnique": 0
//     },
//     "colors": {
//       "total": 1,
//       "unique": [
//         "red"
//       ],
//       "totalUnique": 1
//     }
//   }
// }
```

## License

MIT © [Bart Veneman](http://projectwallace.herokuapp.com)

# css-analyzer

> Analyze your CSS completely

A module that goes through your CSS to find all kinds of relevant statistics,
like the amount of rules, the amount of `!important`s, unique colors, and so on.


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
const cssAnalyzer = require('css-analyzer');

cssAnalyzer('body { color: red !important; }');
//=> {"stylesheet": { "size": 1234, "cohesion": 0.12 }, "selectors": { "total": 123, "totalUnique": 112 }, "etc..."}
```


## API

### cssAnalyzer(input)

#### input

Type: `string`

The CSS (minified or not) that you want to know statistics about


## License

MIT © [Bart Veneman](http://projectwallace.herokuapp.com)

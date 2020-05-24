# css-analyzer

[![NPM Version](https://img.shields.io/npm/v/@projectwallace/css-analyzer.svg)](https://www.npmjs.com/package/@projectwallace/css-analyzer)
![Node.js CI](https://github.com/projectwallace/css-analyzer/workflows/Node.js%20CI/badge.svg)
[![Known Vulnerabilities](https://snyk.io/test/github/projectwallace/css-analyzer/badge.svg)](https://snyk.io/test/github/projectwallace/css-analyzer)
[![Coverage Status](https://coveralls.io/repos/github/projectwallace/css-analyzer/badge.svg?branch=master)](https://coveralls.io/github/projectwallace/css-analyzer?branch=master)
![Dependencies Status](https://img.shields.io/david/projectwallace/css-analyzer.svg)
![Dependencies Status](https://img.shields.io/david/dev/projectwallace/css-analyzer.svg)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![Project: Wallace](https://img.shields.io/badge/Project-Wallace-29c87d.svg)](https://www.projectwallace.com/oss)
[![Financial Contributors on Open Collective](https://opencollective.com/projectwallace/all/badge.svg?label=financial+contributors)](https://opencollective.com/projectwallace) 

> Analyze your CSS

A module that goes through your CSS to find all kinds of relevant statistics,
like the amount of rules, the amount of `!important`s, unique colors, and so on.

## Install

```sh
npm install @projectwallace/css-analyzer
```

or

```sh
yarn add @projectwallace/css-analyzer
```

## Usage

```js
const analyze = require('@projectwallace/css-analyzer');

analyze(`
	p {
		color: blue;
		font-size: 100%;
	}

	.component[data-state="loading"] {
		background-color: whitesmoke;
	}
`)
  .then(result => console.log(result))
  .catch(error => console.error(error))
}
```

```json
{
  "stylesheets.size.uncompressed.totalBytes": 115,
  "stylesheets.size.compressed.gzip.totalBytes": 121,
  "stylesheets.size.compressed.gzip.compressionRatio": -0.05217391304347818,
  "stylesheets.simplicity": 1,
  "stylesheets.cohesion.average": 1.5,
  "stylesheets.cohesion.min.count": 2,
  "stylesheets.cohesion.min.value.declarations": [
    {
      "property": "color",
      "value": "blue",
      "important": false
    },
    {
      "property": "font-size",
      "value": "100%",
      "important": false
    }
  ],
  "stylesheets.cohesion.min.value.selectors": [
    "p"
  ],
  "stylesheets.browserhacks.total": 0,
  "stylesheets.browserhacks.totalUnique": 0,
  "stylesheets.linesOfCode.total": 10,
  "stylesheets.linesOfCode.sourceLinesOfCode.total": 5,
  "atrules.charsets.total": 0,
  "atrules.charsets.unique": [],
  "atrules.charsets.totalUnique": 0,
  "atrules.documents.total": 0,
  "atrules.documents.unique": [],
  "atrules.documents.totalUnique": 0,
  "atrules.fontfaces.total": 0,
  "atrules.fontfaces.unique": [],
  "atrules.fontfaces.totalUnique": 0,
  "atrules.imports.total": 0,
  "atrules.imports.unique": [],
  "atrules.imports.totalUnique": 0,
  "atrules.keyframes.total": 0,
  "atrules.keyframes.unique": [],
  "atrules.keyframes.totalUnique": 0,
  "atrules.keyframes.prefixed.total": 0,
  "atrules.keyframes.prefixed.unique": [],
  "atrules.keyframes.prefixed.totalUnique": 0,
  "atrules.keyframes.prefixed.share": 0,
  "atrules.mediaqueries.total": 0,
  "atrules.mediaqueries.unique": [],
  "atrules.mediaqueries.totalUnique": 0,
  "atrules.mediaqueries.browserhacks.total": 0,
  "atrules.mediaqueries.browserhacks.unique": [],
  "atrules.mediaqueries.browserhacks.totalUnique": 0,
  "atrules.namespaces.total": 0,
  "atrules.namespaces.unique": [],
  "atrules.namespaces.totalUnique": 0,
  "atrules.pages.total": 0,
  "atrules.pages.unique": [],
  "atrules.pages.totalUnique": 0,
  "atrules.supports.total": 0,
  "atrules.supports.unique": [],
  "atrules.supports.totalUnique": 0,
  "atrules.supports.browserhacks.total": 0,
  "atrules.supports.browserhacks.unique": [],
  "atrules.supports.browserhacks.totalUnique": 0,
  "rules.total": 2,
  "rules.empty.total": 0,
  "rules.selectors.average": 1,
  "rules.selectors.minimum.count": 1,
  "rules.selectors.minimum.value": [
    ".component[data-state=\"loading\"]"
  ],
  "rules.selectors.maximum.count": 1,
  "rules.selectors.maximum.value": [
    "p"
  ],
  "selectors.total": 2,
  "selectors.totalUnique": 2,
  "selectors.js.total": 0,
  "selectors.js.unique": [],
  "selectors.js.totalUnique": 0,
  "selectors.id.total": 0,
  "selectors.id.unique": [],
  "selectors.id.totalUnique": 0,
  "selectors.universal.total": 0,
  "selectors.universal.unique": [],
  "selectors.universal.totalUnique": 0,
  "selectors.accessibility.total": 0,
  "selectors.accessibility.unique": [],
  "selectors.accessibility.totalUnique": 0,
  "selectors.specificity.top": [
    {
      "count": 1,
      "value": ".component[data-state=\"loading\"]",
      "specificity": {
        "a": 0,
        "b": 0,
        "c": 2,
        "d": 0
      }
    },
    {
      "count": 1,
      "value": "p",
      "specificity": {
        "a": 0,
        "b": 0,
        "c": 0,
        "d": 1
      }
    }
  ],
  "selectors.specificity.max.value.a": 0,
  "selectors.specificity.max.value.b": 0,
  "selectors.specificity.max.value.c": 2,
  "selectors.specificity.max.value.d": 0,
  "selectors.specificity.max.count": 1,
  "selectors.specificity.max.selectors": [
    {
      "count": 1,
      "value": ".component[data-state=\"loading\"]",
      "specificity": {
        "a": 0,
        "b": 0,
        "c": 2,
        "d": 0
      }
    }
  ],
  "selectors.complexity.max.value": 3,
  "selectors.complexity.max.selectors": [
    {
      "value": ".component[data-state=\"loading\"]",
      "count": 1
    }
  ],
  "selectors.complexity.max.count": 1,
  "selectors.complexity.average": 2,
  "selectors.complexity.sum": 4,
  "selectors.complexity.unique": [
    {
      "value": 1,
      "count": 1
    },
    {
      "value": 3,
      "count": 1
    }
  ],
  "selectors.complexity.totalUnique": 2,
  "selectors.browserhacks.total": 0,
  "selectors.browserhacks.unique": [],
  "selectors.browserhacks.totalUnique": 0,
  "declarations.total": 3,
  "declarations.totalUnique": 3,
  "declarations.importants.total": 0,
  "declarations.importants.share": 0,
  "properties.total": 3,
  "properties.unique": [
    {
      "value": "background-color",
      "count": 1
    },
    {
      "value": "color",
      "count": 1
    },
    {
      "value": "font-size",
      "count": 1
    }
  ],
  "properties.totalUnique": 3,
  "properties.prefixed.total": 0,
  "properties.prefixed.unique": [],
  "properties.prefixed.totalUnique": 0,
  "properties.prefixed.share": 0,
  "properties.browserhacks.total": 0,
  "properties.browserhacks.unique": [],
  "properties.browserhacks.totalUnique": 0,
  "values.total": 3,
  "values.prefixed.total": 0,
  "values.prefixed.unique": [],
  "values.prefixed.totalUnique": 0,
  "values.prefixed.share": 0,
  "values.fontsizes.total": 1,
  "values.fontsizes.unique": [
    {
      "value": "100%",
      "count": 1
    }
  ],
  "values.fontsizes.totalUnique": 1,
  "values.fontfamilies.total": 0,
  "values.fontfamilies.unique": [],
  "values.fontfamilies.totalUnique": 0,
  "values.colors.total": 2,
  "values.colors.unique": [
    {
      "value": "blue",
      "count": 1
    },
    {
      "value": "whitesmoke",
      "count": 1
    }
  ],
  "values.colors.totalUnique": 2,
  "values.colors.duplicates.unique": [],
  "values.colors.duplicates.totalUnique": 0,
  "values.colors.duplicates.total": 0,
  "values.browserhacks.total": 0,
  "values.browserhacks.unique": [],
  "values.browserhacks.totalUnique": 0,
  "values.boxshadows.total": 0,
  "values.boxshadows.unique": [],
  "values.boxshadows.totalUnique": 0,
  "values.textshadows.total": 0,
  "values.textshadows.unique": [],
  "values.textshadows.totalUnique": 0,
  "values.zindexes.total": 0,
  "values.zindexes.unique": [],
  "values.zindexes.totalUnique": 0,
  "values.animations.durations.total": 0,
  "values.animations.durations.unique": [],
  "values.animations.durations.totalUnique": 0,
  "values.animations.timingFunctions.total": 0,
  "values.animations.timingFunctions.unique": [],
  "values.animations.timingFunctions.totalUnique": 0
}
```

## Related projects

- [Wallace CLI](https://github.com/bartveneman/wallace-cli) - CLI tool for
  @projectwallace/css-analyzer
- [Constyble](https://github.com/bartveneman/constyble) - CSS Complexity linter
- [Color Sorter](https://github.com/bartveneman/color-sorter) - Sort CSS colors
  by hue, saturation, lightness and opacity

## Contributors

### Code Contributors

This project exists thanks to all the people who contribute. [[Contribute](CONTRIBUTING.md)].
<a href="https://github.com/projectwallace/css-analyzer/graphs/contributors"><img src="https://opencollective.com/projectwallace/contributors.svg?width=890&button=false" /></a>

### Financial Contributors

Become a financial contributor and help us sustain our community. [[Contribute](https://opencollective.com/projectwallace/contribute)]

#### Individuals

<a href="https://opencollective.com/projectwallace"><img src="https://opencollective.com/projectwallace/individuals.svg?width=890"></a>

#### Organizations

Support this project with your organization. Your logo will show up here with a link to your website. [[Contribute](https://opencollective.com/projectwallace/contribute)]

<a href="https://opencollective.com/projectwallace/organization/0/website"><img src="https://opencollective.com/projectwallace/organization/0/avatar.svg"></a>
<a href="https://opencollective.com/projectwallace/organization/1/website"><img src="https://opencollective.com/projectwallace/organization/1/avatar.svg"></a>
<a href="https://opencollective.com/projectwallace/organization/2/website"><img src="https://opencollective.com/projectwallace/organization/2/avatar.svg"></a>
<a href="https://opencollective.com/projectwallace/organization/3/website"><img src="https://opencollective.com/projectwallace/organization/3/avatar.svg"></a>
<a href="https://opencollective.com/projectwallace/organization/4/website"><img src="https://opencollective.com/projectwallace/organization/4/avatar.svg"></a>
<a href="https://opencollective.com/projectwallace/organization/5/website"><img src="https://opencollective.com/projectwallace/organization/5/avatar.svg"></a>
<a href="https://opencollective.com/projectwallace/organization/6/website"><img src="https://opencollective.com/projectwallace/organization/6/avatar.svg"></a>
<a href="https://opencollective.com/projectwallace/organization/7/website"><img src="https://opencollective.com/projectwallace/organization/7/avatar.svg"></a>
<a href="https://opencollective.com/projectwallace/organization/8/website"><img src="https://opencollective.com/projectwallace/organization/8/avatar.svg"></a>
<a href="https://opencollective.com/projectwallace/organization/9/website"><img src="https://opencollective.com/projectwallace/organization/9/avatar.svg"></a>

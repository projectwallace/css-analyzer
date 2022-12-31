import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { analyze } from '../index.js'

const Properties = suite('Properties')

Properties('counts totals', () => {
  const fixture = `
    properties {
      margin: 0;
      --custom: 1;
    }

    @media print {
      nested {
        --custom: 2;
      }
    }
  `
  const actual = analyze(fixture).properties.total

  assert.is(actual, 3)
})

Properties('calculates uniqueness', () => {
  const fixture = `
    properties {
      margin: 0;
      --custom: 1;
    }

    @media print {
      nested {
        --custom: 1;
      }
    }
  `
  const actual = analyze(fixture).properties
  const expected = {
    'margin': 1,
    '--custom': 2,
  }

  assert.is(actual.totalUnique, 2)
  assert.equal(actual.unique, expected)
  assert.is(actual.uniquenessRatio, 2 / 3)
})

Properties('counts vendor prefixes', () => {
  const fixture = `
    prefixed {
      border-radius: 2px;
      -webkit-border-radius: 2px;
      -khtml-border-radius: 2px;
      -o-border-radius: 2px;
    }

    @media (min-width: 0) {
      @supports (-o-border-radius: 2px) {
        prefixed2 {
          -o-border-radius: 4px;
        }
      }
    }
  `
  const actual = analyze(fixture).properties.prefixed
  const expected = {
    '-webkit-border-radius': 1,
    '-khtml-border-radius': 1,
    '-o-border-radius': 2,
  }

  assert.is(actual.total, 4)
  assert.is(actual.totalUnique, 3)
  assert.equal(actual.unique, expected)
  assert.is(actual.ratio, 4 / 5)
})

Properties('counts browser hacks', () => {
  const fixture = `
    hacks {
      margin: 0;
      *zoom: 1;
    }

    @media (min-width: 0) {
      @supports (-o-border-radius: 2px) {
        hacks2 {
          *zoom: 1;
        }
      }
    }
  `
  const actual = analyze(fixture).properties.browserhacks
  const expected = {
    '*zoom': 2
  }

  assert.is(actual.total, 2)
  assert.is(actual.totalUnique, 1)
  assert.equal(actual.unique, expected)
  assert.is(actual.ratio, 2 / 3)
})

Properties('counts custom properties', () => {
  const fixture = `
    :root {
      --yellow-400: yellow;
    }

    custom {
      margin: 0;
      --yellow-400: yellow;
      color: var(--yellow-400);
    }

    @media (min-width: 0) {
      @supports (-o-border-radius: 2px) {
        custom2 {
          --green-400: green;
          color: var(--green-400);
        }
      }
    }
  `
  const actual = analyze(fixture).properties.custom
  const expected = {
    '--yellow-400': 2,
    '--green-400': 1,
  }

  assert.is(actual.total, 3)
  assert.is(actual.totalUnique, 2)
  assert.equal(actual.unique, expected)
  assert.is(actual.ratio, 3 / 6)
})

Properties('calculates property complexity', () => {
  const fixture = `
    .property-complexity-fixture {
      regular-property: 1;
      --my-custom-property: 2;
      *browserhack-property: 2;
      -webkit-property: 2;
    }
  `
  const actual = analyze(fixture).properties.complexity

  assert.is(actual.max, 2)
  assert.is(actual.mean, 1.75)
  assert.is(actual.median, 2)
  assert.is(actual.min, 1)
  assert.is(actual.mode, 2)
  assert.is(actual.range, 1)
  assert.is(actual.sum, 7)
})

Properties('counts the amount of !important used on custom properties', () => {
  const fixture = `
    .property {
      color: blue;
      --color1: red;
      --color2: yellow !important;
    }

    @media screen {
      .property {
        color: blue;
        --color1: red;
        --color2: yellow !important;
      }
    }

    @layer test {
      .property {
        color: blue;
        --color1: red;
        --color3: green !important;
      }
    }
  `
  const actual = analyze(fixture).properties.custom.importants

  assert.is(actual.total, 3)
  assert.is(actual.totalUnique, 2)
  assert.is(actual.uniquenessRatio, 2 / 3)
  assert.is(actual.ratio, 3 / 6)
  assert.equal(actual.unique, {
    '--color2': 2,
    '--color3': 1,
  })
})

Properties.run()
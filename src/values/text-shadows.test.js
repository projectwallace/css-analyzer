import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { analyze } from '../index.js'

const TextShadows = suite('TextShadows')

TextShadows('finds simple values', () => {
  const fixture = `
    text-shadows-simple {
      text-shadow: 1px 1px 2px black;
      text-shadow: #fc0 1px 0 10px;
      text-shadow: 5px 5px #558abb;
      text-shadow: white 2px 5px;
      text-shadow: 5px 10px;
      text-shadow: red 0 -2px;
    }
  `
  const actual = analyze(fixture).values.textShadows
  const expected = {
    total: 6,
    unique: {
      '1px 1px 2px black': 1,
      '#fc0 1px 0 10px': 1,
      '5px 5px #558abb': 1,
      'white 2px 5px': 1,
      '5px 10px': 1,
      'red 0 -2px': 1,
    },
    totalUnique: 6,
    uniquenessRatio: 1
  }

  assert.equal(actual, expected)
})

TextShadows('finds complex values', () => {
  const fixture = `
    text-shadows-complex {
      text-shadow: 1px 1px 2px black, 0 0 1em blue, 0 0 0.2em blue;
    }
  `
  const actual = analyze(fixture).values.textShadows
  const expected = {
    total: 1,
    unique: {
      '1px 1px 2px black, 0 0 1em blue, 0 0 0.2em blue': 1,
    },
    totalUnique: 1,
    uniquenessRatio: 1
  }

  assert.equal(actual, expected)
})

TextShadows('finds vendor prefixed values', () => {
  const fixture = `
    text-shadows-vendor-prefixed {
      -webkit-text-shadow: 1px 1px 2px black;
    }
  `
  const actual = analyze(fixture).values.textShadows
  const expected = {
    total: 1,
    unique: {
      '1px 1px 2px black': 1,
    },
    totalUnique: 1,
    uniquenessRatio: 1
  }

  assert.equal(actual, expected)
})

TextShadows('ignores keywords', () => {
  const fixture = `
    text-shadows-keyword {
      text-shadow: none;

      /* Global values */
      text-shadow: inherit;
      text-shadow: initial;
      text-shadow: revert;
      text-shadow: revert-layer;
      text-shadow: unset;
    }
  `
  const actual = analyze(fixture).values.textShadows
  const expected = {
    total: 0,
    unique: {},
    totalUnique: 0,
    uniquenessRatio: 0
  }

  assert.equal(actual, expected)
})

TextShadows.run()
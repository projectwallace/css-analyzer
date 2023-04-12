import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { analyze } from '../index.js'

const BoxShadows = suite('BoxShadows')

BoxShadows('finds simple values', () => {
  const fixture = `
    box-shadows-simple {
      box-shadow: 1px 1px 2px black;
    }
  `
  const actual = analyze(fixture).values.boxShadows
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

BoxShadows('finds complex values', () => {
  const fixture = `
    box-shadows-complex {
      box-shadow: 1px 1px 1px black,inset 2px 3px 5px rgba(0,0,0,0.3),inset -2px -3px 5px rgba(255,255,255,0.5);
    }
  `
  const actual = analyze(fixture).values.boxShadows
  const expected = {
    total: 1,
    unique: {
      '1px 1px 1px black,inset 2px 3px 5px rgba(0,0,0,0.3),inset -2px -3px 5px rgba(255,255,255,0.5)': 1,
    },
    totalUnique: 1,
    uniquenessRatio: 1
  }

  assert.equal(actual, expected)
})

BoxShadows('finds vendor prefixed values', () => {
  const fixture = `
    box-shadows-vendor-prefixed {
      -webkit-box-shadow: 1px 1px 2px black;
    }
  `
  const actual = analyze(fixture).values.boxShadows
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

BoxShadows('ignores keywords', () => {
  const fixture = `
    box-shadows-keyword {
      box-shadow: none;

      /* Global keywords */
      box-shadow: initial;
      box-shadow: inherit;
      box-shadow: revert;
      box-shadow: revert-layer;
      box-shadow: unset;
    }
  `
  const actual = analyze(fixture).values.boxShadows
  const expected = {
    total: 0,
    unique: {},
    totalUnique: 0,
    uniquenessRatio: 0
  }

  assert.equal(actual, expected)
})

BoxShadows.run()
import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { analyze } from '../index.js'

const ZIndex = suite('Z-index')

ZIndex('finds simple values', () => {
  const fixture = `
    test {
      z-index: 1;
      z-index: 0;
      z-index: -1;
      z-index: 99999;
      z-index: -100;
      z-index: 0;
      z-index: auto;
      z-index: calc(var(--model-z-index) - 1);
    }
  `
  const actual = analyze(fixture).values.zindexes
  const expected = {
    total: 8,
    totalUnique: 7,
    unique: {
      '0': 2,
      '1': 1,
      '99999': 1,
      '-1': 1,
      '-100': 1,
      'auto': 1,
      'calc(var(--model-z-index) - 1)': 1,
    },
    uniquenessRatio: 7 / 8
  }

  assert.equal(actual, expected)
})

ZIndex('ignores global CSS keywords', () => {
  const fixture = `
    test {
      z-index: inherit;
      z-index: initial;
      z-index: revert;
      z-index: revert-layer;
      z-index: unset;
    }
  `
  const actual = analyze(fixture).values.zindexes
  const expected = {
    total: 0,
    totalUnique: 0,
    unique: {},
    uniquenessRatio: 0
  }

  assert.equal(actual, expected)
})

ZIndex.run()
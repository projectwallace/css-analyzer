import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { analyze } from '../index.js'

const Browserhacks = suite('Values - Browserhacks')

Browserhacks('finds hacks', () => {
  const fixture = `
    value-browserhacks {
      property: value !ie;
      property: value !test;
      property: value!nospace;
      property: value\\9;
    }
  `
  const actual = analyze(fixture).values.browserhacks
  const expected = {
    total: 4,
    totalUnique: 4,
    unique: {
      'value !ie': 1,
      'value !test': 1,
      'value!nospace': 1,
      "value\\9": 1,
    },
    uniquenessRatio: 4 / 4
  }
  assert.equal(actual, expected)
})

Browserhacks('reports no false positives', () => {
  const fixture = `
    value-browserhacks {
      property: value !important;
      content: '!important';
      aspect-ratio: 16/9;
    }
  `
  const actual = analyze(fixture).values.browserhacks
  const expected = {
    total: 0,
    totalUnique: 0,
    unique: {},
    uniquenessRatio: 0,
  }
  assert.equal(actual, expected)
})

Browserhacks.run()
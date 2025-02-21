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
  assert.equal(actual.total, 4)
  assert.equal(actual.total_unique, 4)
  assert.equal(Array.from(actual.list()), [
    { name: 'value !ie', count: 1 },
    { name: 'value !test', count: 1 },
    { name: 'value!nospace', count: 1 },
    { name: 'value\\9', count: 1 },
  ])
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
  assert.equal(actual.total, 0)
  assert.equal(actual.total_unique, 0)
  assert.equal(Array.from(actual.list()), [])
})

Browserhacks.run()
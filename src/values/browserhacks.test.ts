import { describe, test, expect } from 'vitest'
import { analyze } from '../index.js'

test('finds hacks', () => {
  const fixture = `
      value-browserhacks {
        property: value !ie;
        property: value !test;
        property: value!nospace;
        property: value\\9;
      }
    `
  const actual = analyze(fixture).values.browserhacks
  expect(actual.total).toBe(4)
  expect(actual.total_unique).toBe(4)
  expect(Array.from(actual.list())).toEqual([
    { name: 'value !ie', count: 1 },
    { name: 'value !test', count: 1 },
    { name: 'value!nospace', count: 1 },
    { name: 'value\\9', count: 1 },
  ])
})

test('reports no false positives', () => {
  const fixture = `
      value-browserhacks {
        property: value !important;
        content: '!important';
        aspect-ratio: 16/9;
      }
    `
  const actual = analyze(fixture).values.browserhacks
  expect(actual.total).toBe(0)
  expect(actual.total_unique).toBe(0)
  expect(Array.from(actual.list())).toEqual([])
})

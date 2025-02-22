import { describe, test, expect } from 'vitest'
import { analyze } from '../index.js'

test('finds simple values', () => {
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
  expect(actual.total).toBe(7)
  expect(actual.total_unique).toBe(6)
  expect(Array.from(actual.list())).toEqual([
    { name: '1', count: 1 },
    { name: '0', count: 2 },
    { name: '-1', count: 1 },
    { name: '99999', count: 1 },
    { name: '-100', count: 1 },
    { name: 'calc(var(--model-z-index) - 1)', count: 1 },
  ])
})

test('ignores global CSS keywords', () => {
  const fixture = `
    test {
      z-index: auto;

      /* Global values */
      z-index: inherit;
      z-index: initial;
      z-index: revert;
      z-index: revert-layer;
      z-index: unset;
    }
  `
  const actual = analyze(fixture).values.zindexes
  expect(actual.total).toBe(0)
})
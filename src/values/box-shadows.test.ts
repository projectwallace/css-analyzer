import { describe, it, expect } from 'vitest'
import { analyze } from '../index.js'

it('finds simple values', () => {
  const fixture = `
      box-shadows-simple {
        box-shadow: 1px 1px 2px black;
      }
    `
  const actual = analyze(fixture).values.boxShadows
  expect(actual.total).toBe(1)
  expect(actual.total_unique).toBe(1)
  expect(Array.from(actual.list())).toEqual([
    { name: '1px 1px 2px black', count: 1 }
  ])
})

it('finds complex values', () => {
  const fixture = `
      box-shadows-complex {
        box-shadow: 1px 1px 1px black,inset 2px 3px 5px rgba(0,0,0,0.3),inset -2px -3px 5px rgba(255,255,255,0.5);
      }
    `
  const actual = analyze(fixture).values.boxShadows
  expect(actual.total).toBe(1)
  expect(actual.total_unique).toBe(1)
  expect(Array.from(actual.list())).toEqual([
    { name: '1px 1px 1px black,inset 2px 3px 5px rgba(0,0,0,0.3),inset -2px -3px 5px rgba(255,255,255,0.5)', count: 1 }
  ])
})

it('finds vendor prefixed values', () => {
  const fixture = `
      box-shadows-vendor-prefixed {
        -webkit-box-shadow: 1px 1px 2px black;
      }
    `
  const actual = analyze(fixture).values.boxShadows
  expect(actual.total).toBe(1)
  expect(actual.total_unique).toBe(1)
  expect(Array.from(actual.list())).toEqual([
    { name: '1px 1px 2px black', count: 1 }
  ])
})

it.skip('does not report var() fallback values as separate values', () => {
  const fixture = `
      with-fallback {
        box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
    }`
  const actual = analyze(fixture).values.boxShadows
  expect(actual.total).toBe(1)
  expect(actual.total_unique).toBe(1)
  expect(Array.from(actual.list())).toEqual([
    { name: 'var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)', count: 1 }
  ])
})

it('ignores keywords', () => {
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
  expect(actual.total).toBe(0)
  expect(actual.total_unique).toBe(0)
  expect(Array.from(actual.list())).toEqual([])
})

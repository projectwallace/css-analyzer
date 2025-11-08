import { test } from 'vitest'
import { expect } from 'vitest'
import { analyze } from '../index.js'

test('finds simple values', () => {
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

  expect(actual).toEqual(expected)
})

test('finds complex values', () => {
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

  expect(actual).toEqual(expected)
})

test('finds vendor prefixed values', () => {
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

  expect(actual).toEqual(expected)
})

test.skip('does not report var() fallback values as separate values', () => {
  const fixture = `
    with-fallback {
      box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
  }`
  const actual = analyze(fixture).values.boxShadows
  const expected = {
    total: 1,
    unique: {
      'var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)': 1,
    },
    totalUnique: 1,
    uniquenessRatio: 1
  }
  expect(actual).toEqual(expected)
})

test('ignores keywords', () => {
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

  expect(actual).toEqual(expected)
})


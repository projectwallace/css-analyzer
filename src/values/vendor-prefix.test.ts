import { describe, test, expect } from 'vitest'
import { analyze } from '../index.js'

test('finds simple prefixes', () => {
  const fixture = `
    value-vendor-prefix-simple {
      width: -moz-max-content;
      width: -webkit-max-content;
      box-shadow: 0 0 0 3px -moz-mac-focusring;
      position: -webkit-sticky;
      -webkit-transition: -webkit-transform 0.3s ease-out;
      -moz-transition: -moz-transform 0.3s ease-out;
      -o-transition: -o-transform 0.3s ease-out;
      transition: -o-transform 0.3s ease-out;
    }

    not-a-prefix {
      background: var(--test);
      margin: -0.3em;
    }

    @supports (position: -webkit-sticky) {
      thing {
        position: -webkit-sticky;
        position: sticky;
      }
    }
  `
  const actual = analyze(fixture).values.prefixes
  expect(actual.total).toBe(9)
  expect(actual.total_unique).toBe(7)
  expect(Array.from(actual.list())).toEqual([
    { name: '-moz-max-content', count: 1 },
    { name: '-webkit-max-content', count: 1 },
    { name: '0 0 0 3px -moz-mac-focusring', count: 1 },
    { name: '-webkit-sticky', count: 2 },
    { name: '-webkit-transform 0.3s ease-out', count: 1 },
    { name: '-moz-transform 0.3s ease-out', count: 1 },
    { name: '-o-transform 0.3s ease-out', count: 2 },
  ])
})

test('finds nested prefixes', () => {
  const fixture = `
    value-vendor-prefix-nested {
      background-image: -khtml-linear-gradient(90deg, red, green);
      background:
        red,
        -webkit-linear-gradient(transparent, transparent),
        -moz-linear-gradient(transparent, transparent),
        -ms-linear-gradient(transparent, transparent),
        -o-linear-gradient(transparent, transparent);
      grid-template-columns: repeat(3, max(-webkit-max-content, 100vw));
    }
  `
  const actual = analyze(fixture).values.prefixes
  expect(actual.total).toBe(3)
  expect(actual.total_unique).toBe(3)
  expect(Array.from(actual.list())).toEqual([
    { name: '-khtml-linear-gradient(90deg, red, green)', count: 1 },
    { name: 'red,\n        -webkit-linear-gradient(transparent, transparent),\n        -moz-linear-gradient(transparent, transparent),\n        -ms-linear-gradient(transparent, transparent),\n        -o-linear-gradient(transparent, transparent)', count: 1 },
    { name: 'repeat(3, max(-webkit-max-content, 100vw))', count: 1 },
  ])
})

test.skip('finds DEEPLY nested prefixes', () => {
  const fixture = `
    value-vendor-prefix-deeply-nested {
      width: var(--test, -webkit-max-content);
    }
  `
  const actual = analyze(fixture).values.prefixes
  expect(actual.total).toBe(1)
  expect(actual.total_unique).toBe(1)
  expect(Array.from(actual.list())).toEqual([
    { name: 'var(--test, -webkit-max-content)', count: 1 },
  ])
})
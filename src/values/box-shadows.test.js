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
  assert.equal(actual.total, 1)
  assert.equal(actual.total_unique, 1)
  assert.equal(Array.from(actual.list()), [
    { name: '1px 1px 2px black', count: 1 }
  ])
})

BoxShadows('finds complex values', () => {
  const fixture = `
    box-shadows-complex {
      box-shadow: 1px 1px 1px black,inset 2px 3px 5px rgba(0,0,0,0.3),inset -2px -3px 5px rgba(255,255,255,0.5);
    }
  `
  const actual = analyze(fixture).values.boxShadows
  assert.equal(actual.total, 1)
  assert.equal(actual.total_unique, 1)
  assert.equal(Array.from(actual.list()), [
    { name: '1px 1px 1px black,inset 2px 3px 5px rgba(0,0,0,0.3),inset -2px -3px 5px rgba(255,255,255,0.5)', count: 1 }
  ])
})

BoxShadows('finds vendor prefixed values', () => {
  const fixture = `
    box-shadows-vendor-prefixed {
      -webkit-box-shadow: 1px 1px 2px black;
    }
  `
  const actual = analyze(fixture).values.boxShadows
  assert.equal(actual.total, 1)
  assert.equal(actual.total_unique, 1)
  assert.equal(Array.from(actual.list()), [
    { name: '1px 1px 2px black', count: 1 }
  ])
})

BoxShadows.skip('does not report var() fallback values as separate values', () => {
  const fixture = `
    with-fallback {
      box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
  }`
  const actual = analyze(fixture).values.boxShadows
  assert.equal(actual.total, 1)
  assert.equal(actual.total_unique, 1)
  assert.equal(Array.from(actual.list()), [
    { name: 'var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)', count: 1 }
  ])
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
  assert.equal(actual.total, 0)
  assert.equal(actual.total_unique, 0)
  assert.equal(Array.from(actual.list()), [])
})

BoxShadows.run()
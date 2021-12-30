import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { analyze, compareSpecificity } from './index.js'
import { readFileSync } from 'fs'


const fixtures = [
  'bol-com-20190617.css',
  'css-tricks-20190319.css',
  'facebook-20190319.css',
  'gazelle-20210905.css',
  'github-20210501.css',
  'lego-20190617.css',
  'smashing-magazine-20190319.css',
  'trello-20190617.css',
].map(fileName => {
  const css = readFileSync(`./src/__fixtures__/${fileName}`, 'utf-8')
  return {
    css,
    fileName
  }
})

const Api = suite('Public API')

Api('exposes the analyze method', () => {
  assert.is(typeof compareSpecificity, 'function')
})

Api('exposes the compareSpecificity method', () => {
  assert.is(typeof compareSpecificity, 'function')
})

Api('does not break on CSS Syntax Errors', () => {
  assert.not.throws(() => analyze('test, {}'))
  assert.not.throws(() => analyze('test { color red }'))
})

Api('serializes into small objects', () => {
  for (const { css, fileName } of fixtures) {
    const actual = JSON.stringify(analyze(css))
    assert.ok(
      actual.length < css.length * 0.51,
      `Expected serialized size to be smaller (${actual.length} serialized vs. ${css.length} raw css (${actual.length / css.length}) on ${fileName})`
    )
  }
})

Api('it runs fast', () => {
  const start = Date.now()
  for (const { css } of fixtures) {
    analyze(css)
  }
  const end = Date.now()
  const actual = end - start

  assert.ok(actual < 2500, `Expected to be fast, but took ${actual}ms`)
})

Api.run()
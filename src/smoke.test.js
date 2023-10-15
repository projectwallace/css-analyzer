import { readFileSync, writeFileSync } from 'fs'
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { analyze } from './index.js'

const Smoke = suite('Smoke testing')

Object.entries({
  'Bol.com': 'bol-com-20231008',
  'Bootstrap v5.3.2': 'bootstrap-5.3.2',
  'CNN': 'cnn-20231008',
  'CSS Tricks': 'css-tricks-20231008',
  'Gazelle': 'gazelle-20231008',
  'GitHub': 'github-20231008',
  'India Times': 'indiatimes-20231008',
  'Smashing Magazine': 'smashing-magazine-20231008',
  'Trello': 'trello-20231008',
}).map(([name, fileName]) => {
  const css = readFileSync(`./src/__fixtures__/${fileName}.css`, 'utf-8')
  const json = readFileSync(`./src/__fixtures__/${fileName}.json`, 'utf-8')
  return {
    name,
    fileName,
    json,
    css,
  }
}).forEach(({ name, fileName, css, json }) => {
  const actual = analyze(css)
  delete actual.__meta__
  const expected = JSON.parse(json)

  // writeFileSync(`./src/__fixtures__/${fileName}.json`, JSON.stringify(actual, null, 2))

  Smoke(`${name} - Stylesheet`, () => assert.equal(actual.stylesheet, expected.stylesheet))
  Smoke(`${name} - Atrules`, () => assert.equal(actual.atrules, expected.atrules))
  Smoke(`${name} - Rules`, () => assert.equal(actual.rules, expected.rules))
  Smoke(`${name} - Selectors`, () => assert.equal(actual.selectors, expected.selectors))
  Smoke(`${name} - Declarations`, () => assert.equal(actual.declarations, expected.declarations))
  Smoke(`${name} - Properties`, () => assert.equal(actual.properties, expected.properties))
  Smoke(`${name} - Values`, () => assert.equal(actual.values, expected.values))
})

Smoke.run()
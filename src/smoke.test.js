import * as fs from 'fs'
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
  const css = fs.readFileSync(`./src/__fixtures__/${fileName}.css`, 'utf-8')
  const json = fs.readFileSync(`./src/__fixtures__/${fileName}.json`, 'utf-8')
  return {
    name,
    fileName,
    json,
    css,
  }
}).forEach(({ name, fileName, css, json }) => {
  // const result = analyze(css)
  // delete result.__meta__
  // fs.writeFileSync(`./src/__fixtures__/${fileName}.json`, JSON.stringify(result, null, 2))
  Smoke(`${name} matches fixture`, () => {
    const result = analyze(css)
    delete result.__meta__
    assert.fixture(JSON.stringify(result, null, 2), json)
  })
})

Smoke.run()
import * as fs from 'fs'
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { analyze } from './index.js'

const Smoke = suite('Smoke testing')

Object.entries({
  'Bol.com': 'bol-com-20190617',
  'Bootstrap v5.0.0': 'bootstrap-5.0.0',
  'CNN': 'cnn-20220403',
  'CSS Tricks': 'css-tricks-20190319',
  'Facebook': 'facebook-20190319',
  'GitHub': 'github-20210501',
  'Lego.com': 'lego-20190617',
  'Trello': 'trello-20190617',
  'Gazelle': 'gazelle-20210905',
  'Smashing Magazine': 'smashing-magazine-20190319',
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
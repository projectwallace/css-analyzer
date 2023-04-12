import * as fs from 'fs/promises'
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { analyze } from './index.js'

const Smoke = suite('Smoke testing')

let tests = {
  'Bol.com': 'bol-com-20190617',
  'Bootstrap v5.0.0': 'bootstrap-5.0.0',
  'CNN': 'cnn-20220403',
  'CSS Tricks': 'css-tricks-20190319',
  'Facebook': 'facebook-20190319',
  'GitHub': 'github-20210501',
  'India Times': 'indiatimes-20230219',
  'Lego.com': 'lego-20190617',
  'Trello': 'trello-20190617',
  'Gazelle': 'gazelle-20210905',
  'Smashing Magazine': 'smashing-magazine-20190319',
}

for (let [name, fileName] of Object.entries(tests)) {
  let [css, json] = await Promise.all([
    fs.readFile(`./src/__fixtures__/${fileName}.css`, { encoding: 'utf-8' }),
    fs.readFile(`./src/__fixtures__/${fileName}.json`, { encoding: 'utf-8' })
  ])

  // const result = analyze(css)
  // delete result.__meta__
  // await fs.writeFile(`./src/__fixtures__/${fileName}.json`, JSON.stringify(result, null, 2))

  Smoke(`${name} matches fixture`, () => {
    const result = analyze(css)
    delete result.__meta__
    assert.fixture(JSON.stringify(result, null, 2), json)
  })
}

Smoke.run()
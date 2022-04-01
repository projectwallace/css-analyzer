import byteSize from './format-filesize.js'
import { analyze as analyzeCss } from '../dist/analyzer.modern.js'
import * as fs from 'fs'
const files = [
  ['bol-com-20190617', 'Bol.com'],
  ['bootstrap-5.0.0', 'Bootstrap 5.0.0'],
  ['css-tricks-20190319', 'CSS-Tricks'],
  ['facebook-20190319', 'Facebook.com'],
  ['github-20210501', 'GitHub.com'],
  ['gazelle-20210905', 'Gazelle.nl'],
  ['lego-20190617', 'Lego.com'],
  ['smashing-magazine-20190319', 'Smashing Magazine.com'],
  ['trello-20190617', 'Trello.com']
]

let maxLen = -1

files.forEach(([, name]) => {
  if (name.length > maxLen) {
    maxLen = name.length
  }
})

console.log('Running benchmark on /dist/analyzer.js:')

const suite = []

files.forEach(([filename, name]) => {
  const css = fs.readFileSync(`./src/__fixtures__/${filename}.css`, 'utf-8')
  const fileSize = byteSize(css.length)
  suite.push([
    `${name.padEnd(maxLen + 2)} (${fileSize.padStart(6)})`,
    () => analyzeCss(css)
  ])
})

suite.forEach(([name, fn]) => {
  const start = new Date()
  for (let i = 0; i < 10; i++) {
    fn();
  }
  console.log(name, `${new Date() - start}ms`.padStart(6, ' '))
})

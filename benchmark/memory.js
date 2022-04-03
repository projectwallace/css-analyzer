import byteSize from './format-filesize.js'
import { analyze as analyzeCss } from '../dist/analyzer.modern.js'
import * as fs from 'fs'
const files = [
  ['bol-com-20190617', 'Bol.com', 117],
  ['bootstrap-5.0.0', 'Bootstrap 5.0.0', 49],
  ['css-tricks-20190319', 'CSS-Tricks', 50],
  ['cnn-20220403', 'CNN', 360],
  ['facebook-20190319', 'Facebook.com', 71],
  ['github-20210501', 'GitHub.com', 95],
  ['gazelle-20210905', 'Gazelle.nl', 312],
  ['lego-20190617', 'Lego.com', 59],
  ['smashing-magazine-20190319', 'Smashing Magazine.com', 285],
  ['trello-20190617', 'Trello.com', 80]
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
    `${name.padEnd(maxLen + 2)} (${fileSize.padStart(7)})`,
    () => analyzeCss(css),
  ])
})

let startMemory = process.memoryUsage().heapUsed

suite.forEach(([name, fn, memory]) => {
  const start = new Date()
  fn()
  const duration = (new Date() - start)
  console.log(
    name,
    `${duration}ms`.padStart(6, ' '),
  )
})

console.log(((process.memoryUsage().heapUsed - startMemory) / 1024 / 1024).toFixed(2) + 'MB')

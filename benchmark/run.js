import byteSize from './format-filesize.js'
import { analyze as analyzeCss } from '../dist/analyzer.modern.js'
import * as fs from 'fs'
const files = [
  ['bol-com-20190617', 'Bol.com', 115],
  ['bootstrap-5.0.0', 'Bootstrap 5.0.0', 47],
  ['cnn-20220403', 'CNN', 352],
  ['css-tricks-20190319', 'CSS-Tricks', 51],
  ['facebook-20190319', 'Facebook.com', 69],
  ['github-20210501', 'GitHub.com', 91],
  ['gazelle-20210905', 'Gazelle.nl', 300],
  ['lego-20190617', 'Lego.com', 53],
  ['smashing-magazine-20190319', 'Smashing Magazine.com', 285],
  ['trello-20190617', 'Trello.com', 80],
]

let maxLen = -1

files.forEach(([, name]) => {
  if (name.length > maxLen) {
    maxLen = name.length
  }
})

console.log('Running benchmark on /dist/analyzer.js:')

const suite = []

files.forEach(([filename, name, expectedDuration]) => {
  const css = fs.readFileSync(`./src/__fixtures__/${filename}.css`, 'utf-8')
  const fileSize = byteSize(css.length)
  suite.push([
    `${name.padEnd(maxLen + 2)} ${fileSize.padStart(7)}`,
    () => analyzeCss(css),
    expectedDuration,
    css.length,
  ])
})

const RUN_COUNT = 25

suite.forEach(([name, fn, expectedDuration, size]) => {
  const start = new Date()
  for (let i = 0; i < RUN_COUNT; i++) {
    fn();
  }
  const duration = Math.floor((new Date() - start) / RUN_COUNT)
  const overtime = expectedDuration - duration
  const bytesPerSecond = Math.floor(1000 / duration * size)
  console.log(
    name,
    `${duration}ms`.padStart(6, ' '),
    `(${overtime >= 0 ? '-' : '+'}${Math.abs(overtime)}ms ${Math.round(Math.abs(overtime) / duration * 100)}%)`.padStart(10),
    `${byteSize(bytesPerSecond)}/s`.padStart(9)
  )
})

console.log(`Memory used: ${Math.ceil(process.memoryUsage().heapUsed / 1024 / 1024)}MB`)

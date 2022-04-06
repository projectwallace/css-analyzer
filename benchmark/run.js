import byteSize from './format-filesize.js'
import { analyze as analyzeCss } from '../dist/analyzer.modern.js'
import * as fs from 'fs'
const files = [
  ['bol-com-20190617', 'Bol.com', 130],
  ['bootstrap-5.0.0', 'Bootstrap 5.0.0', 54],
  ['cnn-20220403', 'CNN', 406],
  ['css-tricks-20190319', 'CSS-Tricks', 54],
  ['facebook-20190319', 'Facebook.com', 79],
  ['github-20210501', 'GitHub.com', 101],
  ['gazelle-20210905', 'Gazelle.nl', 332],
  ['lego-20190617', 'Lego.com', 63],
  ['smashing-magazine-20190319', 'Smashing Magazine.com', 332],
  ['trello-20190617', 'Trello.com', 86]
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
    `${name.padEnd(maxLen + 2)} (${fileSize.padStart(7)})`,
    () => analyzeCss(css),
    expectedDuration
  ])
})

const RUN_COUNT = 25

suite.forEach(([name, fn, expectedDuration]) => {
  const start = new Date()
  for (let i = 0; i < RUN_COUNT; i++) {
    fn();
  }
  const duration = Math.floor((new Date() - start) / RUN_COUNT)
  const overtime = expectedDuration - duration
  console.log(
    name,
    `${duration}ms`.padStart(6, ' '),
    `(${overtime >= 0 ? '-' : '+'}${Math.abs(overtime)}ms ${Math.round(Math.abs(overtime) / duration * 100)}%)`,
  )
})

console.log(`Memory used: ${Math.ceil(process.memoryUsage().heapUsed / 1024 / 1024)}MB`)

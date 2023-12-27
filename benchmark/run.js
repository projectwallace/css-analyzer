import byteSize from './format-filesize.js'
import { analyze as analyzeCss } from '../dist/analyzer.modern.js'
import * as fs from 'node:fs'
const files = [
  ['bol-com-20231008', 'Bol.com', 63],
  ['bootstrap-5.3.2', 'Bootstrap 5.3.2', 29],
  ['cnn-20231008', 'CNN', 55],
  ['css-tricks-20231008', 'CSS-Tricks', 16],
  ['gazelle-20231008', 'Gazelle.nl', 145],
  ['github-20231008', 'GitHub.com', 148],
  ['indiatimes-20231008', 'IndiaTimes.com', 51],
  ['smashing-magazine-20231008', 'Smashing Magazine.com', 63],
  ['trello-20231008', 'Trello.com', 18],
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
    () => analyzeCss(css, { useUnstableLocations: false }),
    expectedDuration,
    css.length,
  ])
})

const RUN_COUNT = 25
let memStart = process.memoryUsage().heapUsed
let memMin = Infinity
let memMax = 0

function formatMem(mem) {
  return `${Math.ceil(mem / 1024 / 1024)} MB`
}

suite.forEach(([name, fn, expectedDuration, size]) => {
  const start = performance.now()
  for (let i = 0; i < RUN_COUNT; i++) {
    fn();
  }
  const duration = Math.floor((performance.now() - start) / RUN_COUNT)
  const overtime = expectedDuration - duration
  const bytesPerSecond = Math.floor(1000 / duration * size)
  console.log(
    name,
    `${duration}ms`.padStart(6, ' '),
    `(${overtime >= 0 ? '-' : '+'}${Math.abs(overtime)}ms ${Math.round(Math.abs(overtime) / duration * 100)}%)`.padStart(10),
    `${byteSize(bytesPerSecond)}/s`.padStart(9)
  )
  const mem = process.memoryUsage().heapUsed
  if (mem < memMin) memMin = mem
  if (mem > memMax) memMax = mem
})

console.log({
  memStart: formatMem(memStart),
  memMin: formatMem(memMin),
  memMax: formatMem(memMax),
  memRange: formatMem(memMax - memMin),
})

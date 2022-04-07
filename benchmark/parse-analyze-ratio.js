import byteSize from './format-filesize.js'
import { analyze as analyzeCss } from '../dist/analyzer.modern.js'
import * as fs from 'fs'
const files = [
  ['bol-com-20190617', 'Bol.com'],
  ['bootstrap-5.0.0', 'Bootstrap 5.0.0'],
  ['cnn-20220403', 'CNN'],
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

console.log('Running benchmark on /dist/analyzer.modern.js:')
const header = `${'File'.padEnd(maxLen + 2)} | ${'Size'.padStart(7)} |  total | parse | Analyze        |`
console.log(''.padEnd(header.length, '='))
console.log(header)
console.log(''.padEnd(header.length, '='))

files.forEach(([filename, name]) => {
  const css = fs.readFileSync(`./src/__fixtures__/${filename}.css`, 'utf-8')
  const fileSize = byteSize(css.length).padStart(7)
  const result = analyzeCss(css)

  name = name.padEnd(maxLen + 2)
  const parseTime = String(result.__meta__.parseTime).padStart(3)
  const analyzeTime = String(result.__meta__.analyzeTime).padStart(4)
  const totalTime = String(result.__meta__.total).padStart(4)
  const analyzeRatio = (analyzeTime / totalTime * 100).toFixed(1)

  console.log(`${name} | ${fileSize} | ${totalTime}ms | ${parseTime}ms | ${analyzeTime}ms (${analyzeRatio}%) |`)
})

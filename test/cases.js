const path = require('path')
const fs = require('fs')
const test = require('ava')
const analyzer = require('../')

const cases = fs.readdirSync(path.join(__dirname, 'cases'))

cases.forEach(name => {
  const dir = path.join(__dirname, 'cases', name)
  const inputFile = path.join(dir, 'input.css')
  const outputFile = path.join(dir, 'output.json')
  const actual = analyzer(readFile(inputFile))[name]
  const expected = JSON.parse(readFile(outputFile))

  test(name, t => {
    t.deepEqual(actual, expected)
  })
})

function readFile(file) {
  let src = fs.readFileSync(file, 'utf8')

  // Normalize line endings
  src = src.replace(/\r\n/, '\n')

  // Remove trailing newline
  src = src.replace(/\n$/, '')

  return src
}

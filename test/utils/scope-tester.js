const path = require('path')
const fs = require('fs')
const analyzer = require('../..')

function readFile(file) {
  let src = fs.readFileSync(file, 'utf8')

  // Normalize line endings
  src = src.replace(/\r\n/, '\n')

  // Remove trailing newline
  src = src.replace(/\n$/, '')

  return src
}

module.exports = async scope => {
  const dir = path.join(__dirname, '../../test/analyzer', scope)
  const inputFile = path.join(dir, 'input.css')
  const outputFile = path.join(dir, 'output.json')

  const actual = await analyzer(readFile(inputFile))
  const expected = JSON.parse(readFile(outputFile))

  return {
    actual,
    expected
  }
}

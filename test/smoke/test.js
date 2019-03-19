const {promisify} = require('util')
const {readFile} = require('fs')
const {join} = require('path')
const test = require('ava')
const analyze = require('../../src/analyzer')

const readFileAsync = promisify(readFile)

test('it analyzes large CSS files without errors - facebook', async t => {
  const css = await readFileAsync(join(__dirname, '/facebook-20190319.css'))
  await t.notThrowsAsync(analyze(css))
})

test('it analyzes large CSS files without errors - css-tricks', async t => {
  const css = await readFileAsync(join(__dirname, '/css-tricks-20190319.css'))
  await t.notThrowsAsync(analyze(css))
})

test('it analyzes large CSS files without errors - smashing magazine', async t => {
  const css = await readFileAsync(
    join(__dirname, '/smashing-magazine-20190319.css')
  )
  await t.notThrowsAsync(analyze(css))
})

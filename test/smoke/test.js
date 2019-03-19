const {promisify} = require('util')
const {readFile} = require('fs')
const test = require('ava')
const analyze = require('../../src/analyzer')

const readFileAsync = promisify(readFile)

test('it analyzes large CSS files without errors - facebook', async t => {
  const css = await readFileAsync(__dirname + '/facebook-20190319.css')
  await t.notThrowsAsync(analyze(css))

  const result = await analyze(css)
  t.snapshot(result)
})

test('it analyzes large CSS files without errors - css-tricks', async t => {
  const css = await readFileAsync(__dirname + '/css-tricks-20190319.css')
  await t.notThrowsAsync(analyze(css))

  const result = await analyze(css)
  t.snapshot(result)
})

test('it analyzes large CSS files without errors - smashing magazine', async t => {
  const css = await readFileAsync(__dirname + '/smashing-magazine-20190319.css')
  await t.notThrowsAsync(analyze(css))

  const result = await analyze(css)
  t.snapshot(result)
})

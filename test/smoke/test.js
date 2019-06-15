const {readFileSync} = require('fs')
const {join} = require('path')
const test = require('ava')
const analyze = require('../../src/analyzer')

test('it analyzes large CSS files without errors - facebook', async t => {
  const css = readFileSync(join(__dirname, '/facebook-20190319.css'), 'utf8')
  await t.notThrowsAsync(analyze(css))
})

test('it analyzes large CSS files without errors - css-tricks', async t => {
  const css = readFileSync(join(__dirname, '/css-tricks-20190319.css'), 'utf8')
  await t.notThrowsAsync(analyze(css))
})

test.only('it analyzes large CSS files without errors - smashing magazine', async t => {
  const css = readFileSync(
    join(__dirname, '/smashing-magazine-20190319.css'),
    'utf8'
  )
  await t.notThrowsAsync(analyze(css))
})

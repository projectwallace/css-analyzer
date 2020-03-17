const {readFile} = require('fs')
const {promisify} = require('util')
const {join} = require('path')
const test = require('ava')
const analyze = require('../..')

const readFileAsync = promisify(readFile)

const fileNames = [
  'facebook-20190319',
  'css-tricks-20190319',
  'smashing-magazine-20190319',
  'trello-20190617',
  'bol-com-20190617',
  'lego-20190617'
]

fileNames.forEach(fileName => {
  // eslint-disable-next-line unicorn/string-content
  test(`It doesn't fail on real-life CSS - ${fileName}`, async t => {
    const css = await readFileAsync(join(__dirname, `${fileName}.css`), 'utf8')
    await t.notThrowsAsync(() => analyze(css))
    const actual = await analyze(css)
    t.snapshot(actual)
  })
})

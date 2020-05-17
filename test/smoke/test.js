const { readFile } = require('fs')
const { promisify } = require('util')
const { join } = require('path')
const test = require('ava')
const analyze = require('../..')

const readFileAsync = promisify(readFile)

const fileNames = [
	'facebook-20190319',
	'csstricks-20190319',
	'smashingmagazine-20190319',
	'trello-20190617',
	'boldotcom-20190617',
	'lego-20190617',
]

fileNames.forEach((fileName) => {
	// eslint-disable-next-line unicorn/string-content
	test(`It doesn't fail on real-life CSS - ${fileName}`, async (t) => {
		const css = await readFileAsync(
			join(__dirname, 'fixtures', `${fileName}.css`),
			'utf8'
		)
		t.notThrows(() => analyze(css))
	})
})

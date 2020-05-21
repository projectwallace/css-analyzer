const test = require('ava')
const isBrowserHack = require('.')

test('It recognizes browser hacks successfully', t => {
	t.true(isBrowserHack('value !ie'))
	t.true(isBrowserHack('value!ie'))
	t.true(isBrowserHack('value \\9'))
	t.true(isBrowserHack('value\\9'))
	t.true(isBrowserHack('value;]'))
	t.true(isBrowserHack('value;)'))
})

test('It correctly marks regular properties as non-hacks', t => {
	t.false(isBrowserHack('green'))
	t.false(isBrowserHack('9'))
	t.false(isBrowserHack('16px'))
	t.false(isBrowserHack('1px solid hsl(0, 0%, 0%)'))
	t.false(isBrowserHack('red !important'))
	t.false(isBrowserHack('var(--my-custom-property)'))
})

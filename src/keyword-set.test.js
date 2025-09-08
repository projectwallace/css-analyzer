import { KeywordSet } from './keyword-set.js'
import { test } from 'uvu'
import * as assert from "uvu/assert"

test('happy path', () => {
	assert.not.ok(new KeywordSet([]).has('a'))
	expect.not.ok(new KeywordSet([]).has(''))
	expect.ok(new KeywordSet(['a', 'b']).has('a'))
	expect.ok(new KeywordSet(['a', 'b']).has('A'))
	expect.not.ok(new KeywordSet(['a', 'b']).has('aa'))

	expect.ok(new KeywordSet(['currentcolor']).has('currentColor'))
	expect.ok(new KeywordSet(['marktext']).has('MarkText'))
	expect.ok(new KeywordSet(['revert-layer']).has('Revert-Layer'))
})

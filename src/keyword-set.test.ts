import { test, expect } from 'vitest'
import { KeywordSet } from './keyword-set.js'

test('happy path', () => {
	expect(new KeywordSet([]).has('a')).toEqual(false)
	expect(new KeywordSet([]).has('')).toEqual(false)
	expect(new KeywordSet(['a', 'b']).has('a')).toEqual(true)
	expect(new KeywordSet(['a', 'b']).has('A')).toEqual(true)
	expect(new KeywordSet(['a', 'b']).has('aa')).toEqual(false)

	expect(new KeywordSet(['currentcolor']).has('currentColor')).toEqual(true)
	expect(new KeywordSet(['marktext']).has('MarkText')).toEqual(true)
	expect(new KeywordSet(['revert-layer']).has('Revert-Layer')).toEqual(true)
})

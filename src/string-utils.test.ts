import { test, expect } from 'vitest'
import { ends_with } from './string-utils.js'

test('endsWith', () => {
	expect(ends_with('keyframes', 'keyframes')).toEqual(true)
	expect(ends_with('keyframes', '-webkit-keyframes')).toEqual(true)
	expect(ends_with('keyframes', 'testkeyframes')).toEqual(true)
	expect(ends_with('keyframes', 'testKeyframes')).toEqual(true)
	expect(ends_with('test', 'test')).toEqual(true)

	expect(ends_with('keyframes', '')).toEqual(false)
	expect(ends_with('keyframes', 'test')).toEqual(false)
	expect(ends_with('keyframes', 'eyframes')).toEqual(false)
})

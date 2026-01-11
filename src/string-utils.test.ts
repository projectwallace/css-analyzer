import { test, expect } from 'vitest'
import { endsWith } from './string-utils.js'

test('endsWith', () => {
	expect(endsWith('keyframes', 'keyframes')).toEqual(true)
	expect(endsWith('keyframes', '-webkit-keyframes')).toEqual(true)
	expect(endsWith('keyframes', 'testkeyframes')).toEqual(true)
	expect(endsWith('keyframes', 'testKeyframes')).toEqual(true)
	expect(endsWith('test', 'test')).toEqual(true)

	expect(endsWith('keyframes', '')).toEqual(false)
	expect(endsWith('keyframes', 'test')).toEqual(false)
	expect(endsWith('keyframes', 'eyframes')).toEqual(false)
})

import { test, expect } from 'vitest'
import { strEquals, endsWith, startsWith } from './string-utils.js'

test('strEquals', () => {
	expect(strEquals('keyframes', 'keyframes')).toEqual(true)
	expect(strEquals('blue', 'BLUE')).toEqual(true)
	expect(strEquals('test-me', 'TEST-me')).toEqual(true)

	expect(strEquals('-webkit-keyframes', 'keyframes')).toEqual(false)
	expect(strEquals('abc', 'abcd')).toEqual(false)
	expect(strEquals('abc', '')).toEqual(false)
})

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

test('startsWith', () => {
	expect(startsWith('data:', 'data:<xml>')).toEqual(true)
	expect(startsWith('animation', 'animation')).toEqual(true)
	expect(startsWith('animation', 'animation-duration')).toEqual(true)
	expect(startsWith('animation', 'Animation')).toEqual(true)
	expect(startsWith('test', 'test')).toEqual(true)

	expect(startsWith('data:', 'nope')).toEqual(false)
	expect(startsWith('test', '')).toEqual(false)
	expect(startsWith('test-test', 'test')).toEqual(false)
})

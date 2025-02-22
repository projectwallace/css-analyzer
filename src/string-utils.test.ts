import { test, expect } from 'vitest'
import { strEquals, endsWith, startsWith } from './string-utils.js'

test('strEquals', () => {
  expect(strEquals('keyframes', 'keyframes')).toBe(true)
  expect(strEquals('blue', 'BLUE')).toBe(true)
  expect(strEquals('test-me', 'TEST-me')).toBe(true)

  expect(strEquals('-webkit-keyframes', 'keyframes')).toBe(false)
  expect(strEquals('abc', 'abcd')).toBe(false)
  expect(strEquals('abc', '')).toBe(false)
})

test('endsWith', () => {
  expect(endsWith('keyframes', 'keyframes')).toBe(true)
  expect(endsWith('keyframes', '-webkit-keyframes')).toBe(true)
  expect(endsWith('keyframes', 'testkeyframes')).toBe(true)
  expect(endsWith('keyframes', 'testKeyframes')).toBe(true)
  expect(endsWith('test', 'test')).toBe(true)

  expect(endsWith('keyframes', '')).toBe(false)
  expect(endsWith('keyframes', 'test')).toBe(false)
  expect(endsWith('keyframes', 'eyframes')).toBe(false)
})

test('startsWith', () => {
  expect(startsWith('data:', 'data:<xml>')).toBe(true)
  expect(startsWith('animation', 'animation')).toBe(true)
  expect(startsWith('animation', 'animation-duration')).toBe(true)
  expect(startsWith('animation', 'Animation')).toBe(true)
  expect(startsWith('test', 'test')).toBe(true)

  expect(startsWith('data:', 'nope')).toBe(false)
  expect(startsWith('test', '')).toBe(false)
  expect(startsWith('test-test', 'test')).toBe(false)
})
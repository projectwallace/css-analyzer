import { test, expect } from 'vitest'
import { strEquals, endsWith, startsWith } from './string-utils.js'

test('strEquals', () => {
  expect(strEquals('keyframes', 'keyframes')).toBeTruthy()
  expect(strEquals('blue', 'BLUE')).toBeTruthy()
  expect(strEquals('test-me', 'TEST-me')).toBeTruthy()

  expect(strEquals('-webkit-keyframes', 'keyframes')).toBeFalsy()
  expect(strEquals('abc', 'abcd')).toBeFalsy()
  expect(strEquals('abc', '')).toBeFalsy()
})

test('endsWith', () => {
  expect(endsWith('keyframes', 'keyframes')).toBeTruthy()
  expect(endsWith('keyframes', '-webkit-keyframes')).toBeTruthy()
  expect(endsWith('keyframes', 'testkeyframes')).toBeTruthy()
  expect(endsWith('keyframes', 'testKeyframes')).toBeTruthy()
  expect(endsWith('test', 'test')).toBeTruthy()

  expect(endsWith('keyframes', '')).toBeFalsy()
  expect(endsWith('keyframes', 'test')).toBeFalsy()
  expect(endsWith('keyframes', 'eyframes')).toBeFalsy()
})

test('startsWith', () => {
  expect(startsWith('data:', 'data:<xml>')).toBeTruthy()
  expect(startsWith('animation', 'animation')).toBeTruthy()
  expect(startsWith('animation', 'animation-duration')).toBeTruthy()
  expect(startsWith('animation', 'Animation')).toBeTruthy()
  expect(startsWith('test', 'test')).toBeTruthy()

  expect(startsWith('data:', 'nope')).toBeFalsy()
  expect(startsWith('test', '')).toBeFalsy()
  expect(startsWith('test-test', 'test')).toBeFalsy()
})
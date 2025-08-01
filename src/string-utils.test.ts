import { test, expect } from 'vitest'
import { str_equals, ends_with, starts_with } from './string-utils.js'

test('strEquals', () => {
  expect(str_equals('keyframes', 'keyframes')).toBeTruthy()
  expect(str_equals('blue', 'BLUE')).toBeTruthy()
  expect(str_equals('test-me', 'TEST-me')).toBeTruthy()

  expect(str_equals('-webkit-keyframes', 'keyframes')).toBeFalsy()
  expect(str_equals('abc', 'abcd')).toBeFalsy()
  expect(str_equals('abc', '')).toBeFalsy()
})

test('endsWith', () => {
  expect(ends_with('keyframes', 'keyframes')).toBeTruthy()
  expect(ends_with('keyframes', '-webkit-keyframes')).toBeTruthy()
  expect(ends_with('keyframes', 'testkeyframes')).toBeTruthy()
  expect(ends_with('keyframes', 'testKeyframes')).toBeTruthy()
  expect(ends_with('test', 'test')).toBeTruthy()

  expect(ends_with('keyframes', '')).toBeFalsy()
  expect(ends_with('keyframes', 'test')).toBeFalsy()
  expect(ends_with('keyframes', 'eyframes')).toBeFalsy()
})

test('startsWith', () => {
  expect(starts_with('data:', 'data:<xml>')).toBeTruthy()
  expect(starts_with('animation', 'animation')).toBeTruthy()
  expect(starts_with('animation', 'animation-duration')).toBeTruthy()
  expect(starts_with('animation', 'Animation')).toBeTruthy()
  expect(starts_with('test', 'test')).toBeTruthy()

  expect(starts_with('data:', 'nope')).toBeFalsy()
  expect(starts_with('test', '')).toBeFalsy()
  expect(starts_with('test-test', 'test')).toBeFalsy()
})
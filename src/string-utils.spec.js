import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { strEquals, endsWith, startsWith } from './string-utils.js'

const StringUtils = suite('Public API')

StringUtils('strEquals', () => {
  assert.ok(strEquals('keyframes', 'keyframes'))
  assert.ok(strEquals('blue', 'BLUE'))
  assert.ok(strEquals('test-me', 'TEST-me'))

  assert.not.ok(strEquals('-webkit-keyframes', 'keyframes'))
  assert.not.ok(strEquals('abc', 'abcd'))
  assert.not.ok(strEquals('abc', ''))
})

StringUtils('endsWith', () => {
  assert.ok(endsWith('keyframes', 'keyframes'))
  assert.ok(endsWith('keyframes', '-webkit-keyframes'))
  assert.ok(endsWith('keyframes', 'testkeyframes'))
  assert.ok(endsWith('keyframes', 'testKeyframes'))
  assert.ok(endsWith('test', 'test'))

  assert.not.ok(endsWith('keyframes', ''))
  assert.not.ok(endsWith('keyframes', 'test'))
  assert.not.ok(endsWith('keyframes', 'eyframes'))
})

StringUtils('startsWith', () => {
  assert.ok(startsWith('data:', 'data:<xml>'))
  assert.ok(startsWith('animation', 'animation'))
  assert.ok(startsWith('animation', 'animation-duration'))
  assert.ok(startsWith('animation', 'Animation'))
  assert.ok(startsWith('test', 'test'))

  assert.not.ok(startsWith('data:', 'nope'))
  assert.not.ok(startsWith('test', ''))
  assert.not.ok(startsWith('test-test', 'test'))
})

StringUtils.run()
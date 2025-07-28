import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { isHack, isCustom, isProperty } from './property-utils.js'

const PropertyUtils = suite('Property Utils')

PropertyUtils('isHack', () => {
  assert.ok(isHack('/property'))
  assert.ok(isHack('//property'))
  assert.ok(isHack('_property'))
  assert.ok(isHack('+property'))
  assert.ok(isHack('*property'))
  assert.ok(isHack('&property'))
  assert.ok(isHack('#property'))
  assert.ok(isHack('$property'))

  assert.not.ok(isHack('property'))
  assert.not.ok(isHack('-property'))
  assert.not.ok(isHack('--property'))
})

PropertyUtils('isCustom', () => {
  assert.ok(isCustom('--property'))
  assert.ok(isCustom('--MY-PROPERTY'))
  assert.ok(isCustom('--x'))

  assert.not.ok(isCustom('property'))
  assert.not.ok(isCustom('-property'))
  assert.not.ok(isCustom('-webkit-property'))
  assert.not.ok(isCustom('-moz-property'))
})

PropertyUtils('isProperty', () => {
  assert.ok(isProperty('animation', 'animation'))
  assert.ok(isProperty('animation', 'ANIMATION'))
  assert.ok(isProperty('animation', '-webkit-animation'))
  assert.ok(isProperty('font', '_font'))
  assert.ok(isProperty('width', '*width'))

  assert.not.ok(isProperty('animation', '--animation'))
  assert.not.ok(isProperty('property', '--Property'))
})

PropertyUtils.run()
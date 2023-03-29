import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { is_browserhack, is_custom, isProperty } from './property-utils.js'

const PropertyUtils = suite('Property Utils')

PropertyUtils('is_browserhack', () => {
  assert.ok(is_browserhack('/property'))
  assert.ok(is_browserhack('//property'))
  assert.ok(is_browserhack('_property'))
  assert.ok(is_browserhack('+property'))
  assert.ok(is_browserhack('*property'))
  assert.ok(is_browserhack('&property'))
  assert.ok(is_browserhack('#property'))
  assert.ok(is_browserhack('$property'))

  assert.not.ok(is_browserhack('property'))
  assert.not.ok(is_browserhack('-property'))
  assert.not.ok(is_browserhack('--property'))
})

PropertyUtils('is_custom', () => {
  assert.ok(is_custom('--property'))
  assert.ok(is_custom('--MY-PROPERTY'))
  assert.ok(is_custom('--x'))

  assert.not.ok(is_custom('property'))
  assert.not.ok(is_custom('-property'))
  assert.not.ok(is_custom('-webkit-property'))
  assert.not.ok(is_custom('-moz-property'))
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
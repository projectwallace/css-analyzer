import { test, expect } from 'vitest'
import { isHack, isCustom, isProperty } from './property-utils.js'

test('isHack', () => {
	expect(isHack('/property')).toEqual(true)
	expect(isHack('//property')).toEqual(true)
	expect(isHack('_property')).toEqual(true)
	expect(isHack('+property')).toEqual(true)
	expect(isHack('*property')).toEqual(true)
	expect(isHack('&property')).toEqual(true)
	expect(isHack('#property')).toEqual(true)
	expect(isHack('$property')).toEqual(true)

	expect(isHack('property')).toEqual(false)
	expect(isHack('-property')).toEqual(false)
	expect(isHack('--property')).toEqual(false)
})

test('isCustom', () => {
	expect(isCustom('--property')).toEqual(true)
	expect(isCustom('--MY-PROPERTY')).toEqual(true)
	expect(isCustom('--x')).toEqual(true)

	expect(isCustom('property')).toEqual(false)
	expect(isCustom('-property')).toEqual(false)
	expect(isCustom('-webkit-property')).toEqual(false)
	expect(isCustom('-moz-property')).toEqual(false)
})

test('isProperty', () => {
	expect(isProperty('animation', 'animation')).toEqual(true)
	expect(isProperty('animation', 'ANIMATION')).toEqual(true)
	expect(isProperty('animation', '-webkit-animation')).toEqual(true)
	expect(isProperty('font', '_font')).toEqual(true)
	expect(isProperty('width', '*width')).toEqual(true)

	expect(isProperty('animation', '--animation')).toEqual(false)
	expect(isProperty('property', '--Property')).toEqual(false)
})

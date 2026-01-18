import { test, expect } from 'vitest'
import { isProperty } from './property-utils.js'

test('isProperty', () => {
	expect(isProperty('animation', 'animation')).toEqual(true)
	expect(isProperty('animation', 'ANIMATION')).toEqual(true)
	expect(isProperty('animation', '-webkit-animation')).toEqual(true)
	expect(isProperty('font', '_font')).toEqual(true)
	expect(isProperty('width', '*width')).toEqual(true)

	expect(isProperty('animation', '--animation')).toEqual(false)
	expect(isProperty('property', '--Property')).toEqual(false)
})

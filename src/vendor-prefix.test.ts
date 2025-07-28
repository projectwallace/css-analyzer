import { test, expect } from 'vitest'
import { hasVendorPrefix } from './vendor-prefix.js'

test('happy path', () => {
	expect(hasVendorPrefix('-webkit-animation')).toBeTruthy()
	expect(hasVendorPrefix('-moz-animation')).toBeTruthy()
	expect(hasVendorPrefix('-ms-animation')).toBeTruthy()
	expect(hasVendorPrefix('-o-animation')).toBeTruthy()
})

test('custom properties are not prefixed', () => {
	expect(hasVendorPrefix('--custom-property')).toBeFalsy()
})

test('no prefix', () => {
	expect(hasVendorPrefix('animation')).toBeFalsy()
	expect(hasVendorPrefix('webkit-test')).toBeFalsy()
})

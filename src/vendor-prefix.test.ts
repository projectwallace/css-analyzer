import { test, expect } from 'vitest'
import { has_vendor_prefix } from './vendor-prefix.js'

test('happy path', () => {
	expect(has_vendor_prefix('-webkit-animation')).toBeTruthy()
	expect(has_vendor_prefix('-moz-animation')).toBeTruthy()
	expect(has_vendor_prefix('-ms-animation')).toBeTruthy()
	expect(has_vendor_prefix('-o-animation')).toBeTruthy()
})

test('custom properties are not prefixed', () => {
	expect(has_vendor_prefix('--custom-property')).toBeFalsy()
})

test('no prefix', () => {
	expect(has_vendor_prefix('animation')).toBeFalsy()
	expect(has_vendor_prefix('webkit-test')).toBeFalsy()
})

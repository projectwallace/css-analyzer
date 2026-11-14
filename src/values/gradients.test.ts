import { test, expect } from 'vitest'
import { is_gradient_function } from './gradients.ts'

test.each([
	'linear-gradient',
	'radial-gradient',
	'conic-gradient',
	'repeating-linear-gradient',
	'repeating-radial-gradient',
	'repeating-conic-gradient',
	'LINEAR-GRADIENT',
	'-webkit-linear-gradient',
	'-moz-radial-gradient',
	'-o-linear-gradient',
	'-ms-linear-gradient',
	'-WEBKIT-Repeating-Conic-Gradient',
	// The old syntax: -webkit-gradient(linear, ...)
	'-webkit-gradient',
])('%s is a gradient function', (name) => {
	expect(is_gradient_function(name)).toBe(true)
})

test.each([
	'rgb',
	'-webkit-rgb',
	'url',
	'gradient',
	'linear',
	'linear-gradient()',
	'my-gradient',
	'-webkit-linear',
	'',
])('%s is not a gradient function', (name) => {
	expect(is_gradient_function(name)).toBe(false)
})

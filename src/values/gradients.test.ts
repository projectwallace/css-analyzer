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
])('%s is a gradient function', (name) => {
	expect(is_gradient_function(name)).toBe(true)
})

test.each(['rgb', 'url', 'gradient', 'linear', 'linear-gradient()', 'my-gradient', ''])(
	'%s is not a gradient function',
	(name) => {
		expect(is_gradient_function(name)).toBe(false)
	},
)

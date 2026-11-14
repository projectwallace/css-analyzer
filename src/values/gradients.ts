import { KeywordSet } from '../utils/collections/keyword-set.ts'

const gradient_functions = new KeywordSet([
	'linear-gradient',
	'radial-gradient',
	'conic-gradient',
	'repeating-linear-gradient',
	'repeating-radial-gradient',
	'repeating-conic-gradient',
])

/** Is this the name of a CSS gradient function (`linear-gradient`, `repeating-conic-gradient`, ...)? */
export function is_gradient_function(name: string): boolean {
	return gradient_functions.has(name)
}

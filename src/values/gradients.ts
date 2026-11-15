import { str_equals, strip_vendor_prefix } from '@projectwallace/css-parser'
import { KeywordSet } from '../utils/collections/keyword-set.ts'

const gradient_functions = new KeywordSet([
	'linear-gradient',
	'radial-gradient',
	'conic-gradient',
	'repeating-linear-gradient',
	'repeating-radial-gradient',
	'repeating-conic-gradient',
])

/** Is this a gradient function name? */
export function is_gradient_function(name: string): boolean {
	const unprefixed = strip_vendor_prefix(name)
	// The old `-webkit-gradient(linear, ...)` only exists with a prefix
	return (
		gradient_functions.has(unprefixed) ||
		(unprefixed.length !== name.length && str_equals('gradient', unprefixed))
	)
}

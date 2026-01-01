import { endsWith } from '../string-utils.js'
import { is_custom, is_vendor_prefixed } from '@projectwallace/css-parser'

/**
 * @see https://github.com/csstree/csstree/blob/master/lib/utils/names.js#L69
 */
export function isHack(property: string): boolean {
	if (is_custom(property) || is_vendor_prefixed(property)) return false

	let code = property.charCodeAt(0)

	return (
		code === 47 || // /
		code === 42 || // *
		code === 95 || // _
		code === 43 || // +
		code === 38 || // &
		code === 36 || // $
		code === 35
	) // #
}

/**
 * A check to verify that a propery is `basename` or a prefixed
 * version of that, but never a custom property that accidentally
 * ends with the same substring.
 *
 * @example
 * isProperty('animation', 'animation') // true
 * isProperty('animation', '-webkit-animation') // true
 * isProperty('animation', '--my-animation') // false
 *
 * @returns True if `property` equals `basename` without prefix
 */
export function isProperty(basename: string, property: string): boolean {
	if (is_custom(property)) return false
	return endsWith(basename, property)
}

/**
 * Get the basename for a property with a vendor prefix
 * @returns The property name without vendor prefix
 */
export function basename(property: string): string {
	if (is_vendor_prefixed(property)) {
		return property.slice(property.indexOf('-', 2) + 1)
	}
	return property
}

import { hasVendorPrefix } from '../vendor-prefix.js'
import { endsWith } from '../string-utils.js'

export function isCustom(property: string): boolean {
	if (property.length < 3) return false
	// 45 === '-'.charCodeAt(0)
	return property.charCodeAt(0) === 45 && property.charCodeAt(1) === 45
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
	if (isCustom(property)) return false
	return endsWith(basename, property)
}

/**
 * Get the basename for a property with a vendor prefix
 * @returns The property name without vendor prefix
 */
export function basename(property: string): string {
	if (hasVendorPrefix(property)) {
		return property.slice(property.indexOf('-', 2) + 1)
	}
	return property
}

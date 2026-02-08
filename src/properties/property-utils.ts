import { KeywordSet } from '../keyword-set.js'
import { is_custom, is_vendor_prefixed } from '@projectwallace/css-parser'

export const SPACING_RESET_PROPERTIES = new Set([
	'margin',
	'margin-block',
	'margin-inline',
	'margin-top',
	'margin-block-start',
	'margin-block-end',
	'margin-inline-end',
	'margin-inline-end',
	'margin-right',
	'margin-bottom',
	'margin-left',
	'padding',
	'padding-block',
	'padding-inline',
	'padding-top',
	'padding-right',
	'padding-bottom',
	'padding-left',
	'padding-block-start',
	'padding-block-end',
	'padding-inline-start',
	'padding-inline-end',
])

export const border_radius_properties = new KeywordSet([
	'border-radius',
	'border-top-left-radius',
	'border-top-right-radius',
	'border-bottom-right-radius',
	'border-bottom-left-radius',
	'border-start-start-radius',
	'border-start-end-radius',
	'border-end-end-radius',
	'border-end-start-radius',
])

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
 * Get the normalized basename for a property with a vendor prefix
 * @returns The property name without vendor prefix
 */
export function basename(property: string): string {
	if (is_custom(property)) {
		return property
	}

	if (is_vendor_prefixed(property)) {
		return property.slice(property.indexOf('-', 2) + 1).toLowerCase()
	}

	if (isHack(property)) {
		return property.slice(1).toLowerCase()
	}

	return property.toLowerCase()
}

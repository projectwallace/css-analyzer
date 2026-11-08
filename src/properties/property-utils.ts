import { is_custom, is_vendor_prefixed, property_basename } from '@projectwallace/css-parser'
import { KeywordSet } from '../keyword-set.ts'

export const shorthand_properties: Set<string> = new Set([
	'all',
	'animation',
	'background',
	'border',
	'border-block-end',
	'border-block-start',
	'border-bottom',
	'border-color',
	'border-image',
	'border-inline-end',
	'border-inline-start',
	'border-left',
	'border-radius',
	'border-right',
	'border-style',
	'border-top',
	'border-width',
	'column-rule',
	'columns',
	'contain-intrinsic-size',
	'flex',
	'flex-flow',
	'font',
	'gap',
	'grid',
	'grid-area',
	'grid-column',
	'grid-row',
	'grid-template',
	'inset',
	'list-style',
	'margin',
	'mask',
	'offset',
	'outline',
	'overflow',
	'padding',
	'place-content',
	'place-items',
	'place-self',
	'scroll-margin',
	'scroll-padding',
	'scroll-timeline',
	'text-decoration',
	'text-emphasis',
	'transition',
	'vertical-align',
])

export const SPACING_RESET_PROPERTIES: Set<string> = new Set([
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

export const border_radius_properties: KeywordSet = new KeywordSet([
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
	if (is_custom(property) || is_vendor_prefixed(property)) {
		return false
	}

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
 * Normalized property name: lowercased, without vendor prefix or hack characters.
 * Custom properties are returned as written. Alias of css-parser's `property_basename()`.
 */
export const basename: (property: string) => string = property_basename

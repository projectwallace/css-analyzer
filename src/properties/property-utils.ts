import { KeywordSet } from '../utils/collections/keyword-set.ts'
import { is_custom, is_vendor_prefixed } from '@projectwallace/css-parser'

export const shorthand_properties: ReadonlySet<string> = new Set([
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

export const spacing_reset_properties: ReadonlySet<string> = new Set([
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
export function is_hack(property: string): boolean {
	if (is_custom(property) || is_vendor_prefixed(property)) {
		return false
	}

	const code = property.charCodeAt(0)

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

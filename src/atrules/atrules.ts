import { strEquals, startsWith, endsWith } from '../string-utils.js'
import { type Raw, walk, type AtrulePrelude, type Declaration } from '@eslint/css-tree'
import { Identifier, MediaQuery } from '../css-tree-node-types.js'

/**
 * Check whether node.property === property and node.value === value,
 * but case-insensitive and fast.
 * @param property - The CSS property to compare with (case-insensitive)
 * @param value - The identifier/keyword value to compare with
 * @returns true if declaratioNode is the given property: value, false otherwise
 */
function isPropertyValue(node: Declaration, property: string, value: string): boolean {
	// @ts-expect-error TODO: fix this
	let firstChild = node.value.children.first
	return strEquals(property, node.property) && firstChild.type === Identifier && strEquals(value, firstChild.name)
}

/**
 * Check if an @supports atRule is a browserhack
 * @returns true if the atrule is a browserhack
 */
export function isSupportsBrowserhack(prelude: AtrulePrelude | Raw): boolean {
	let returnValue = false

	walk(prelude, function (node) {
		if (node.type === 'Declaration') {
			if (isPropertyValue(node, '-webkit-appearance', 'none') || isPropertyValue(node, '-moz-appearance', 'meterbar')) {
				returnValue = true
				return this.break
			}
		}
	})

	return returnValue
}

/**
 * Check if a @media atRule is a browserhack
 * @returns true if the atrule is a browserhack
 */
export function isMediaBrowserhack(prelude: AtrulePrelude | Raw): boolean {
	let returnValue = false

	walk(prelude, function (node) {
		// @ts-expect-error outdated css-tree types
		let { mediaType, name, value, type, kind } = node

		if (type === MediaQuery && mediaType !== null) {
			// Note: CSSTree adds a trailing space to \\9
			if (startsWith('\\0', mediaType) || endsWith('\\9 ', mediaType)) {
				returnValue = true
				return this.break
			}
		} else if (type === 'Feature' && kind === 'media') {
			if (value && value.unit && value.unit === '\\0') {
				returnValue = true
				return this.break
			} else if (
				strEquals('-moz-images-in-menus', name) ||
				strEquals('min--moz-device-pixel-ratio', name) ||
				strEquals('-ms-high-contrast', name)
			) {
				returnValue = true
				return this.break
			} else if (strEquals('min-resolution', name) && value && strEquals('.001', value.value) && strEquals('dpcm', value.unit)) {
				returnValue = true
				return this.break
			} else if (strEquals('-webkit-min-device-pixel-ratio', name)) {
				if (value && value.value && (strEquals('0', value.value) || strEquals('10000', value.value))) {
					returnValue = true
					return this.break
				}
			}
		}
	})

	return returnValue
}

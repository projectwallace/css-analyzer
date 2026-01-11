import { type CSSNode, str_equals, walk, BREAK } from '@projectwallace/css-parser'

/**
 * Check if an @supports atRule is a browserhack (Wallace parser version)
 * @param node - The Atrule CSSNode from Wallace parser
 * @returns true if the atrule is a browserhack
 */
export function isSupportsBrowserhack(node: CSSNode): boolean {
	let isBrowserhack = false

	walk(node, function (n) {
		// Check SupportsQuery nodes for browserhack patterns
		if (n.type_name === 'SupportsQuery') {
			const prelude = n.prelude || n.value || ''
			const normalizedPrelude = prelude.toString().toLowerCase().replaceAll(/\s+/g, '')

			// Check for known browserhack patterns
			if (normalizedPrelude.includes('-webkit-appearance:none') || normalizedPrelude.includes('-moz-appearance:meterbar')) {
				isBrowserhack = true
				return BREAK
			}
		}
	})

	return isBrowserhack
}

/**
 * Check if a @media atRule is a browserhack (Wallace parser version)
 * @param node - The Atrule CSSNode from Wallace parser
 * @returns true if the atrule is a browserhack
 */
export function isMediaBrowserhack(node: CSSNode): boolean {
	let isBrowserhack = false

	walk(node, function (n) {
		// Check MediaType nodes for \0 prefix or \9 suffix
		if (n.type_name === 'MediaType') {
			const text = n.text || ''
			if (text.startsWith('\\0') || text.includes('\\9')) {
				isBrowserhack = true
				return BREAK
			}
		}

		// Check Feature nodes
		if (n.type_name === 'Feature') {
			const name = n.name || ''

			// Check for vendor-specific feature hacks
			if (
				str_equals('-moz-images-in-menus', name) ||
				str_equals('min--moz-device-pixel-ratio', name) ||
				str_equals('-ms-high-contrast', name)
			) {
				isBrowserhack = true
				return BREAK
			}

			// Check for min-resolution with .001dpcm
			if (str_equals('min-resolution', name) && n.has_children) {
				for (const child of n) {
					if (child.type_name === 'Dimension' && child.value === 0.001 && str_equals('dpcm', child.unit || '')) {
						isBrowserhack = true
						return BREAK
					}
				}
			}

			// Check for -webkit-min-device-pixel-ratio with 0 or 10000
			if (str_equals('-webkit-min-device-pixel-ratio', name) && n.has_children) {
				for (const child of n) {
					if (child.type_name === 'Number' && (child.value === 0 || child.value === 10000)) {
						isBrowserhack = true
						return BREAK
					}
				}
			}

			// Check for \0 unit hack (appears as Identifier node)
			if (n.has_children) {
				for (const child of n) {
					if (child.type_name === 'Identifier' && child.text === '\\0') {
						isBrowserhack = true
						return BREAK
					}
				}
			}
		}
	})

	return isBrowserhack
}

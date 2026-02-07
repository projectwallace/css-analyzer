import {
	type CSSNode,
	str_equals,
	walk,
	BREAK,
	SUPPORTS_QUERY,
	MEDIA_TYPE,
	MEDIA_FEATURE,
	DIMENSION,
	NUMBER,
	IDENTIFIER,
} from '@projectwallace/css-parser'

/**
 * Check if an @supports atRule is a browserhack (Wallace parser version)
 * @param node - The Atrule CSSNode from Wallace parser
 * @returns true if the atrule is a browserhack
 */
export function isSupportsBrowserhack(node: CSSNode): false | string {
	let browserhack: false | string = false

	walk(node, function (n) {
		// Check SupportsQuery nodes for browserhack patterns
		if (n.type === SUPPORTS_QUERY) {
			const prelude = n.prelude || n.value || ''
			const normalizedPrelude = prelude.toString().toLowerCase().replaceAll(/\s+/g, '')

			// Check for known browserhack patterns
			if (normalizedPrelude.includes('-webkit-appearance:none')) {
				browserhack = '-webkit-appearance: none'
				return BREAK
			}
			if (normalizedPrelude.includes('-moz-appearance:meterbar')) {
				browserhack = '-moz-appearance: meterbar'
				return BREAK
			}
		}
	})

	return browserhack
}

/**
 * Check if a @media atRule is a browserhack (Wallace parser version)
 * @param node - The Atrule CSSNode from Wallace parser
 * @returns true if the atrule is a browserhack
 */
export function isMediaBrowserhack(node: CSSNode): false | string {
	let browserhack: string | false = false

	walk(node, function (n) {
		// Check MediaType nodes for \0 prefix or \9 suffix
		if (n.type === MEDIA_TYPE) {
			const text = n.text || ''

			if (text.startsWith('\\0')) {
				browserhack = '\\0'
				return BREAK
			}

			if (text.includes('\\9')) {
				browserhack = '\\9'
				return BREAK
			}
		}

		// Check Feature nodes
		if (n.type === MEDIA_FEATURE) {
			const name = n.name || ''

			if (str_equals('-moz-images-in-menus', name)) {
				browserhack = '-moz-images-in-menus'
				return BREAK
			}

			if (str_equals('min--moz-device-pixel-ratio', name)) {
				browserhack = 'min--moz-device-pixel-ratio'
				return BREAK
			}

			// Check for vendor-specific feature hacks
			if (str_equals('-ms-high-contrast', name)) {
				browserhack = '-ms-high-contrast'
				return BREAK
			}

			// Check for min-resolution with .001dpcm
			if (str_equals('min-resolution', name) && n.has_children) {
				for (const child of n) {
					if (child.type === DIMENSION && child.value === 0.001 && str_equals('dpcm', child.unit || '')) {
						browserhack = 'min-resolution: .001dpcm'
						return BREAK
					}
				}
			}

			// Check for -webkit-min-device-pixel-ratio with 0 or 10000
			if (str_equals('-webkit-min-device-pixel-ratio', name) && n.has_children) {
				for (const child of n) {
					if (child.type === NUMBER && (child.value === 0 || child.value === 10000)) {
						browserhack = '-webkit-min-device-pixel-ratio'
						return BREAK
					}
				}
			}

			// Check for \0 unit hack (appears as Identifier node)
			if (n.has_children) {
				for (const child of n) {
					if (child.type === IDENTIFIER && child.text === '\\0') {
						browserhack = '\\0'
						return BREAK
					}
				}
			}
		}
	})

	return browserhack
}

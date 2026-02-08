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
 */
export function isSupportsBrowserhack(node: CSSNode, on_hack: (hack: string) => void): void {
	walk(node, function (n) {
		// Check SupportsQuery nodes for browserhack patterns
		if (n.type === SUPPORTS_QUERY) {
			const prelude = n.prelude || n.value || ''
			const normalizedPrelude = prelude.toString().toLowerCase().replaceAll(/\s+/g, '')

			// Check for known browserhack patterns
			if (normalizedPrelude.includes('-webkit-appearance:none')) {
				on_hack('-webkit-appearance: none')
				return BREAK
			}
			if (normalizedPrelude.includes('-moz-appearance:meterbar')) {
				on_hack('-moz-appearance: meterbar')
				return BREAK
			}
		}
	})
}

/**
 * Check if a @media atRule is a browserhack (Wallace parser version)
 * @param node - The Atrule CSSNode from Wallace parser
 * @returns true if the atrule is a browserhack
 */
export function isMediaBrowserhack(node: CSSNode, on_hack: (hack: string) => void): void {
	walk(node, function (n) {
		// Check MediaType nodes for \0 prefix or \9 suffix
		if (n.type === MEDIA_TYPE) {
			const text = n.text || ''

			if (text.startsWith('\\0')) {
				on_hack('\\0')
				return BREAK
			}

			if (text.includes('\\9')) {
				on_hack('\\9')
				return BREAK
			}
		}

		// Check Feature nodes
		if (n.type === MEDIA_FEATURE) {
			const name = n.name || ''

			if (str_equals('-moz-images-in-menus', name)) {
				on_hack('-moz-images-in-menus')
				return BREAK
			}

			if (str_equals('min--moz-device-pixel-ratio', name)) {
				on_hack('min--moz-device-pixel-ratio')
				return BREAK
			}

			// Check for vendor-specific feature hacks
			if (str_equals('-ms-high-contrast', name)) {
				on_hack('-ms-high-contrast')
				return BREAK
			}

			// Check for min-resolution with .001dpcm
			if (str_equals('min-resolution', name) && n.has_children) {
				for (const child of n) {
					if (child.type === DIMENSION && child.value === 0.001 && str_equals('dpcm', child.unit || '')) {
						on_hack('min-resolution: .001dpcm')
						return BREAK
					}
				}
			}

			// Check for -webkit-min-device-pixel-ratio with 0 or 10000
			if (str_equals('-webkit-min-device-pixel-ratio', name) && n.has_children) {
				for (const child of n) {
					if (child.type === NUMBER && (child.value === 0 || child.value === 10000)) {
						on_hack('-webkit-min-device-pixel-ratio')
						return BREAK
					}
				}
			}

			// Check for \0 unit hack (appears as Identifier node)
			if (n.has_children) {
				for (const child of n) {
					if (child.type === IDENTIFIER && child.text === '\\0') {
						on_hack('\\0')
						return BREAK
					}
				}
			}
		}
	})
}

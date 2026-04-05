import {
	str_equals,
	walk,
	BREAK,
	DIMENSION,
	NUMBER,
	IDENTIFIER,
	is_media_feature,
	is_media_type,
	is_supports_query,
	type CSSNode,
} from '@projectwallace/css-parser'

/**
 * Check if an @supports atRule is a browserhack (Wallace parser version)
 * @param prelude - The Atrule CSSNode from Wallace parser
 */
export function isSupportsBrowserhack(prelude: CSSNode, on_hack: (hack: string) => void): void {
	walk(prelude, function (node) {
		// Check SupportsQuery nodes for browserhack patterns
		if (is_supports_query(node)) {
			const normalizedPrelude = node.value.toString().toLowerCase().replaceAll(/\s+/g, '')

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
 * @param prelude - The Atrule CSSNode from Wallace parser
 * @returns true if the atrule is a browserhack
 */
export function isMediaBrowserhack(prelude: CSSNode, on_hack: (hack: string) => void): void {
	walk(prelude, function (node) {
		// Check MediaType nodes for \0 prefix or \9 suffix
		if (is_media_type(node)) {
			const text = node.value

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
		if (is_media_feature(node)) {
			const name = node.property

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
			if (str_equals('min-resolution', name) && node.has_children) {
				for (const child of node) {
					if (
						child.type === DIMENSION &&
						child.value === 0.001 &&
						str_equals('dpcm', child.unit || '')
					) {
						on_hack('min-resolution: .001dpcm')
						return BREAK
					}
				}
			}

			// Check for -webkit-min-device-pixel-ratio with 0 or 10000
			if (str_equals('-webkit-min-device-pixel-ratio', name) && node.has_children) {
				for (const child of node) {
					if (child.type === NUMBER && (child.value === 0 || child.value === 10000)) {
						on_hack('-webkit-min-device-pixel-ratio')
						return BREAK
					}
				}
			}

			// Check for \0 unit hack (appears as Identifier node)
			if (node.has_children) {
				for (const child of node) {
					if (child.type === IDENTIFIER && child.text === '\\0') {
						on_hack('\\0')
						return BREAK
					}
				}
			}
		}
	})
}

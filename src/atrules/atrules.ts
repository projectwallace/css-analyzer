import {
	str_equals,
	walk,
	BREAK,
	is_identifier,
	is_media_feature,
	is_media_type,
	is_supports_query,
	is_dimension,
	is_number,
	type AnyNode,
} from '@projectwallace/css-parser'
import { type Input, as_prelude } from '../adapter/css-parser.js'

function find_hacks(
	name: string,
	input: Input,
	check: (node: AnyNode, on_hack: (hack: string) => void) => unknown,
): string[] {
	const hacks: string[] = []
	for (const prelude of as_prelude(name, input)) {
		walk(prelude, function (node) {
			const result = check(node, (hack) => hacks.push(hack))
			if (result === BREAK) return BREAK
		})
		if (hacks.length > 0) break
	}
	return hacks
}

/**
 * Find @supports browserhacks (`-webkit-appearance: none`, `-moz-appearance: meterbar`).
 * @param input - Prelude text, or an already parsed prelude node
 * @returns The hacks that were found (at most one)
 */
export function get_supports_browserhacks(input: Input): string[] {
	return find_hacks('supports', input, function (node, on_hack) {
		// Check SupportsQuery nodes for browserhack patterns
		if (is_supports_query(node)) {
			const normalized_prelude = node.value.toString().toLowerCase().replaceAll(/\s+/g, '')

			// Check for known browserhack patterns
			if (normalized_prelude.includes('-webkit-appearance:none')) {
				on_hack('-webkit-appearance: none')
				return BREAK
			}
			if (normalized_prelude.includes('-moz-appearance:meterbar')) {
				on_hack('-moz-appearance: meterbar')
				return BREAK
			}
		}
	})
}

/**
 * Find @media browserhacks (`\\0`, `\\9`, `-ms-high-contrast`, `min-resolution: .001dpcm`, ...).
 * @param input - Prelude text, or an already parsed prelude node
 * @returns The hacks that were found (at most one)
 */
export function get_media_browserhacks(input: Input): string[] {
	return find_hacks('media', input, function (node, on_hack) {
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
			if (str_equals('min-resolution', name) && node.value !== null && is_dimension(node.value)) {
				const dimension = node.value
				if (dimension.value === 0.001 && str_equals('dpcm', dimension.unit || '')) {
					on_hack('min-resolution: .001dpcm')
					return BREAK
				}
			}

			// Check for -webkit-min-device-pixel-ratio with 0 or 10000
			if (
				str_equals('-webkit-min-device-pixel-ratio', name) &&
				node.value !== null &&
				is_number(node.value)
			) {
				const num = node.value.value
				if (num === 0 || num === 10000) {
					on_hack('-webkit-min-device-pixel-ratio')
					return BREAK
				}
			}
		}

		// \0 inside a media feature value (e.g. min-width:0\0) — sibling of the numeric value
		if (is_identifier(node) && node.text === '\\0') {
			on_hack('\\0')
			return BREAK
		}
	})
}

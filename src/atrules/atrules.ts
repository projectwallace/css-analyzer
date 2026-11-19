import {
	str_equals,
	walk,
	BREAK,
	is_container_query,
	is_identifier,
	is_media_feature,
	is_media_type,
	is_supports_query,
	is_dimension,
	is_number,
	type AnyNode,
	type AtrulePrelude,
	str_index_of,
} from '@projectwallace/css-parser'
import { type HackMatch, type Match, to_match } from '../utils/location.ts'

function find_hacks(
	prelude: AtrulePrelude,
	check: (node: AnyNode, on_hack: (hack: string) => void) => unknown,
): HackMatch[] {
	const hacks: HackMatch[] = []
	walk(prelude, function (node) {
		const result = check(node, (hack) => hacks.push({ ...to_match(node), hack }))
		if (result === BREAK) {
			return BREAK
		}
	})
	return hacks
}

const whitespace_regex = /\s+/g

/** Find @supports browserhacks */
export function get_supports_browserhacks(prelude: AtrulePrelude): HackMatch[] {
	return find_hacks(prelude, function (node, on_hack) {
		// Check SupportsQuery nodes for browserhack patterns
		if (is_supports_query(node)) {
			const normalized_prelude = node.value.toString().replaceAll(whitespace_regex, '')

			// Check for known browserhack patterns
			if (str_index_of('-webkit-appearance:none', normalized_prelude) !== -1) {
				on_hack('-webkit-appearance: none')
				return BREAK
			}
			if (str_index_of('-moz-appearance:meterbar', normalized_prelude) !== -1) {
				on_hack('-moz-appearance: meterbar')
				return BREAK
			}
		}
	})
}

/** Find @media browserhacks */
export function get_media_browserhacks(prelude: AtrulePrelude): HackMatch[] {
	return find_hacks(prelude, function (node, on_hack) {
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

		// \0 inside a media feature value (e.g. min-width:0\0) — a dimension with unit \0
		if (is_dimension(node) && node.unit === '\\0') {
			on_hack('\\0')
			return BREAK
		}

		// \0 as a separate identifier node
		if (is_identifier(node) && node.text === '\\0') {
			on_hack('\\0')
			return BREAK
		}
	})
}

/** The container name of a `@container` prelude, or `null` */
export function get_container_query_name(prelude: AtrulePrelude): Match | null {
	const query = prelude.first_child
	if (query && is_container_query(query)) {
		const name = query.first_child
		if (name && is_identifier(name)) {
			return to_match(name)
		}
	}
	return null
}

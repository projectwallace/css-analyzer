import type { Value } from '@projectwallace/css-parser'
import {
	type CSSNode,
	is_custom,
	is_function,
	is_identifier,
	is_string,
	property_basename,
	str_equals,
} from '@projectwallace/css-parser'
import { type NamedMatch, to_match } from '../utils/location.ts'
import { unquote } from '../utils/string-utils.ts'
import { destructure_font_shorthand, system_fonts } from './destructure-font-shorthand.ts'

/** One match per font family (`extract_font_families()` has the whole list as one match); pass `'font'` as property to read a shorthand. With `deep`, the names inside functions (`var(--font, Inter)`) are found too. */
export function get_font_families(
	input: Value,
	property: string = 'font-family',
	options: { deep?: boolean } = {},
): NamedMatch[] {
	const value = input
	// Only what starts here belongs to the family list
	let from = value.start
	if (str_equals('font', property_basename(property))) {
		const family = system_fonts.has(value.text)
			? null
			: destructure_font_shorthand(value)?.font_family
		if (!family) {
			return []
		}
		from = family.start_offset
	}

	const families: NamedMatch[] = []
	// A family of unquoted words (`Source Code Pro`) runs from the first to the last word
	let first: CSSNode | undefined
	let last: CSSNode | undefined

	function end_family(): void {
		if (first && last) {
			const length = last.end - first.start
			const start = first.start - value.start
			const text = value.text.substring(start, start + length)
			families.push({
				value: text,
				name: text,
				line: first.line,
				column: first.column,
				start_offset: first.start,
				end_offset: first.start + length,
			})
		}
		first = undefined
		last = undefined
	}

	function read(node: CSSNode): void {
		if (node.start < from) {
			return
		}
		// `var(--font, Inter)`: the custom property is not a family
		if (is_identifier(node) && !(options.deep && is_custom(node.text))) {
			first ??= node
			last = node
		} else {
			end_family()
			// Commas end a family; anything else that is not a name (var()) is left out
			if (is_string(node)) {
				families.push({ ...to_match(node), name: unquote(node.text) })
			} else if (options.deep && is_function(node)) {
				node.for_each(read)
				end_family()
			}
		}
	}

	value.for_each(read)
	end_family()

	return families
}

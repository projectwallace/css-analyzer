import {
	type CSSNode,
	is_identifier,
	is_string,
	property_basename,
	str_equals,
} from '@projectwallace/css-parser'
import { type ValueInput, as_value } from '../utils/input.ts'
import { type Match, to_match } from '../utils/location.ts'
import { unquote } from '../utils/string-utils.ts'
import { destructure_font_shorthand, system_fonts } from './destructure-font-shorthand.ts'

/** One match per font family; pass `'font'` as property to read a shorthand */
export function get_font_families(input: ValueInput, property: string = 'font-family'): Match[] {
	const value = as_value(input)
	// Only what starts here belongs to the family list
	let from = value.start
	if (str_equals('font', property_basename(property))) {
		const family = system_fonts.has(value.text)
			? null
			: destructure_font_shorthand(value)?.font_family
		if (!family) {
			return []
		}
		from = family.offset
	}

	const families: Match[] = []
	// A family of unquoted words (`Source Code Pro`) runs from the first to the last word
	let first: CSSNode | undefined
	let last: CSSNode | undefined

	function end_family(): void {
		if (first && last) {
			const length = last.end - first.start
			const start = first.start - value.start
			families.push({
				value: value.text.substring(start, start + length),
				line: first.line,
				column: first.column,
				offset: first.start,
				length,
			})
		}
		first = undefined
		last = undefined
	}

	value.for_each(function (node) {
		if (node.start < from) {
			return
		}
		if (is_identifier(node)) {
			first ??= node
			last = node
		} else {
			end_family()
			// Commas end a family; anything else that is not a name (var()) is left out
			if (is_string(node)) {
				families.push(to_match(node, unquote(node.text)))
			}
		}
	})
	end_family()

	return families
}

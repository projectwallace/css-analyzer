import type { CSSNode } from '@projectwallace/css-parser'

const NEWLINE = 10

export type Location = {
	line: number
	column: number
	/** Where it starts, as an offset into the parsed text */
	start_offset: number
	/** Where it ends (exclusive) */
	end_offset: number
}

/** A found `value` and where: the source text at that location. Offsets are relative to the parsed text. */
export type Match = Location & { value: string }

export type LocationOptions = { length?: number }

/** A match with a name that is derived from the text: unquoted, without prefix, normalized, ... */
export type NamedMatch = Match & { name: string }

/** A match of a value part: `value` is the source text, `text` the text that is counted (without a browserhack) */
export type TextMatch = Match & { text: string }

/** A browserhack and where it is: `value` is the text, `hack` says which hack it is */
export type HackMatch = Match & { hack: string }

/** Where `node` is in the source. `length` limits it to the start of the node (e.g. only the property name). */
export function to_location(node: CSSNode, options: LocationOptions = {}): Location {
	const length = options.length ?? node.length
	return {
		line: node.line,
		column: node.column,
		start_offset: node.start,
		end_offset: node.start + length,
	}
}

/** `node` as a match: its source text, or the first `length` characters of it */
export function to_match(node: CSSNode, options: LocationOptions = {}): Match {
	const text = node.text
	const length = options.length ?? node.length
	return {
		value: length === text.length ? text : text.substring(0, length),
		...to_location(node, { length }),
	}
}

/** The part of `node` that starts `index` characters into its text, as a match */
export function to_match_in(node: CSSNode, part: { index: number; length: number }): Match {
	const { index, length } = part
	const source = node.text
	let line = node.line
	let column = node.column
	// The part can be on a later line than the start of the node
	for (let i = 0; i < index; i++) {
		if (source.charCodeAt(i) === NEWLINE) {
			line++
			column = 1
		} else {
			column++
		}
	}
	const start_offset = node.start + index
	return {
		value: source.substring(index, index + length),
		line,
		column,
		start_offset,
		end_offset: start_offset + length,
	}
}

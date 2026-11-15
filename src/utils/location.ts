import type { CSSNode } from '@projectwallace/css-parser'

/** Where something is in the source */
export type Location = {
	line: number
	column: number
	offset: number
	length: number
}

/**
 * Something a utility found, and where. Offsets are relative to the text that was parsed: the string
 * for text input, the source the node came from for node input.
 */
export type Match = Location & { text: string }

/** Where `node` is in the source. `length` overrides the node's length (e.g. only the property name). */
export function to_location(node: CSSNode, length: number = node.length): Location {
	return {
		line: node.line,
		column: node.column,
		offset: node.start,
		length,
	}
}

/** `node` as a match. `text` and `length` default to those of the node. */
export function to_match(
	node: CSSNode,
	text: string = node.text,
	length: number = node.length,
): Match {
	return {
		text,
		line: node.line,
		column: node.column,
		offset: node.start,
		length,
	}
}

/** The part of `node` that starts `index` characters into its text, as a match */
export function to_match_in(node: CSSNode, index: number, length: number, text: string): Match {
	const source = node.text
	let line = node.line
	let column = node.column
	// The part can be on a later line than the start of the node
	for (let i = 0; i < index; i++) {
		if (source.charCodeAt(i) === 10) {
			line++
			column = 1
		} else {
			column++
		}
	}
	return { text, line, column, offset: node.start + index, length }
}

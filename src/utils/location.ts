import type { CSSNode } from '@projectwallace/css-parser'

export type Location = {
	line: number
	column: number
	offset: number
	length: number
}

/** A found `value` and where; offsets are relative to the parsed text */
export type Match<T = string> = Location & { value: T }

/** Where `node` is in the source. `length` overrides the node's length (e.g. only the property name). */
export function to_location(node: CSSNode, length: number = node.length): Location {
	return {
		line: node.line,
		column: node.column,
		offset: node.start,
		length,
	}
}

/** `node` as a match. `value` and `length` default to the text and length of the node. */
export function to_match(
	node: CSSNode,
	value: string = node.text,
	length: number = node.length,
): Match {
	return {
		value,
		line: node.line,
		column: node.column,
		offset: node.start,
		length,
	}
}

/** The part of `node` that starts `index` characters into its text, as a match */
export function to_match_in(node: CSSNode, index: number, length: number, value: string): Match {
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
	return { value, line, column, offset: node.start + index, length }
}

/** A match inside `source`, for text that was not parsed into nodes. Line and column start at 1. */
export function to_match_in_source(
	source: string,
	index: number,
	length: number,
	value: string,
): Match {
	let line = 1
	let column = 1
	for (let i = 0; i < index; i++) {
		if (source.charCodeAt(i) === 10) {
			line++
			column = 1
		} else {
			column++
		}
	}
	return { value, line, column, offset: index, length }
}

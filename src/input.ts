import {
	type CSSNode,
	type SelectorList,
	type Value,
	is_selector,
	is_selector_list,
	parse_atrule_prelude,
	parse_value,
} from '@projectwallace/css-parser'
import { parse_selector_list } from '@projectwallace/css-parser/parse-selector'

/** What the utilities accept: CSS text, or a node that was already parsed (e.g. by a collector) */
export type Input = string | CSSNode

export function as_value(input: Input): Value {
	return typeof input === 'string' ? parse_value(input) : (input as Value)
}

/** A selector list, or a single selector, as nodes. Throws a TypeError for anything else. */
export function as_selectors(input: Input): CSSNode[] {
	if (typeof input === 'string') {
		let list: SelectorList
		try {
			list = parse_selector_list(input)
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error)
			throw new TypeError(
				`Could not convert passed in source '${input}' to SelectorList: ${message}`,
			)
		}
		return Array.from(list)
	}
	if (is_selector(input)) return [input]
	if (is_selector_list(input)) return Array.from(input)
	throw new TypeError('Passed in source is an Object but no AST / AST of the type SelectorList')
}

/** Nodes of an at-rule prelude. A string is parsed as the prelude of the at-rule called `name`. */
export function as_prelude(name: string, input: Input): CSSNode[] {
	return typeof input === 'string' ? parse_atrule_prelude(name, input) : [input]
}

import {
	type AnyNode,
	type AtrulePrelude,
	type Raw,
	type Selector,
	type SelectorList,
	type Value,
	is_selector,
	is_selector_list,
	parse_atrule_prelude,
	parse_value,
} from '@projectwallace/css-parser'
import { parse_selector_list } from '@projectwallace/css-parser/parse-selector'

/** CSS text, or a value that was already parsed (e.g. by a collector) */
export type ValueInput = string | Value

/** CSS text, or a selector or selector list that was already parsed */
export type SelectorInput = string | Selector | SelectorList

/** CSS text, or an at-rule prelude that was already parsed (`Raw` when preludes were not parsed) */
export type PreludeInput = string | AtrulePrelude | Raw

export function as_value(input: ValueInput): Value {
	return typeof input === 'string' ? parse_value(input) : input
}

/** A selector list, or a single selector, as selectors */
export function as_selectors(input: SelectorInput): Selector[] {
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
		return Array.from(list) as Selector[]
	}
	if (is_selector(input)) {
		return [input]
	}
	if (is_selector_list(input)) {
		return Array.from(input) as Selector[]
	}
	throw new TypeError('Passed in source is an Object but no AST / AST of the type SelectorList')
}

/** Nodes of an at-rule prelude. A string is parsed as the prelude of the at-rule called `name`. */
export function as_prelude(name: string, input: PreludeInput): AnyNode[] {
	return typeof input === 'string' ? parse_atrule_prelude(name, input) : [input]
}

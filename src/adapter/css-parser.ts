/**
 * The ONLY module (besides legacy code and the pure utils that still take parser nodes)
 * that talks to `@projectwallace/css-parser`. The engine and collectors use this
 * adapter, so another parser can be swapped in by re-implementing this file.
 */
import {
	type Atrule,
	type CSSNode,
	type Declaration,
	type Value,
	is_custom,
	parse,
	parse_value,
	parse_atrule_prelude,
	is_selector_list,
	is_selector,
	traverse,
	walk,
	SKIP,
	is_raw,
	STYLESHEET,
	STYLE_RULE,
	AT_RULE,
	SELECTOR,
	DECLARATION,
	HASH,
	FUNCTION,
	IDENTIFIER,
	DIMENSION,
	NUMBER,
	STRING,
	URL,
	OPERATOR,
	PARENTHESIS,
	UNICODE_RANGE,
	RATIO,
} from '@projectwallace/css-parser'
import { parse_selector_list } from '@projectwallace/css-parser/parse-selector'
import { basename } from '../properties/property-utils.js'

/** Treat as opaque: only the adapter knows what is inside. */
export type AstNode = CSSNode

export type Location = {
	line: number
	column: number
	offset: number
	length: number
	/** File name, only present when the input was added with `{ source }` */
	source?: string
}

export type ParseOptions = {
	selectors: boolean
	values: boolean
	atrule_preludes: boolean
}

export type NodeKind = 'stylesheet' | 'rule' | 'atrule' | 'selector' | 'declaration' | 'other'

export type ValueKind =
	| 'hash'
	| 'function'
	| 'identifier'
	| 'dimension'
	| 'number'
	| 'string'
	| 'url'
	| 'operator'
	| 'parenthesis'
	| 'unicode_range'
	| 'ratio'
	| 'other'

export type DeclarationFacts = {
	property: string
	is_important: boolean
	is_browserhack: boolean
	is_vendor_prefixed: boolean
}

export function parse_css(
	css: string,
	options: ParseOptions,
	on_comment?: (comment: { line: number; column: number; start: number; length: number }) => void,
): AstNode {
	return parse(css, {
		parse_selectors: options.selectors,
		parse_values: options.values,
		parse_atrule_preludes: options.atrule_preludes,
		on_comment,
	})
}

function get_kind(node: AstNode): NodeKind {
	switch (node.type) {
		case STYLE_RULE:
			return 'rule'
		case AT_RULE:
			return 'atrule'
		case DECLARATION:
			return 'declaration'
		case SELECTOR:
			return 'selector'
		case STYLESHEET:
			return 'stylesheet'
		default:
			return 'other'
	}
}

function get_value_kind(node: AstNode): ValueKind {
	switch (node.type) {
		case HASH:
			return 'hash'
		case FUNCTION:
			return 'function'
		case IDENTIFIER:
			return 'identifier'
		case DIMENSION:
			return 'dimension'
		case NUMBER:
			return 'number'
		case STRING:
			return 'string'
		case URL:
			return 'url'
		case OPERATOR:
			return 'operator'
		case PARENTHESIS:
			return 'parenthesis'
		case UNICODE_RANGE:
			return 'unicode_range'
		case RATIO:
			return 'ratio'
		default:
			return 'other'
	}
}

/**
 * Depth-first walk. `enter` may return `true` to skip the children of the node.
 * `leave` is always called for nodes that were entered.
 */
export function walk_ast(
	root: AstNode,
	enter: (node: AstNode, kind: NodeKind) => boolean | void,
	leave: (node: AstNode, kind: NodeKind) => void,
): void {
	traverse(root, {
		enter(node) {
			return enter(node, get_kind(node)) === true ? SKIP : undefined
		},
		leave(node) {
			leave(node, get_kind(node))
		},
	})
}

/** Visit every node inside a declaration value (the root VALUE node is not reported) */
export function walk_value(value: AstNode, visit: (node: AstNode, kind: ValueKind) => void): void {
	walk(value, function (node) {
		if (node !== value) visit(node, get_value_kind(node))
	})
}

export function get_declaration_facts(node: AstNode): DeclarationFacts {
	const declaration = node as Declaration
	return {
		property: basename(declaration.property ?? ''),
		is_important: declaration.is_important,
		is_browserhack: declaration.is_browserhack,
		is_vendor_prefixed: declaration.is_vendor_prefixed,
	}
}

export function is_custom_property(node: AstNode): boolean {
	return is_custom((node as Declaration).property ?? '')
}

/** The parsed value node of a declaration, or `undefined` if values are not parsed or empty */
export function get_declaration_value(node: AstNode): AstNode | undefined {
	const value = (node as Declaration).value
	if (!value || is_raw(value)) return undefined
	return value
}

/** Raw text of the declaration value, available even when values are not parsed */
export function get_declaration_value_text(node: AstNode): string {
	return (node as Declaration).value?.text ?? ''
}

/** Lowercased at-rule name without vendor prefix, e.g. `-webkit-keyframes` -> `keyframes` */
export function get_atrule_name(node: AstNode): string {
	return basename((node as Atrule).name ?? '')
}

export function get_text(node: AstNode): string {
	return node.text
}

export function get_location(node: AstNode, source?: string): Location {
	const loc: Location = {
		line: node.line,
		column: node.column,
		offset: node.start,
		length: node.length,
	}
	if (source !== undefined) loc.source = source
	return loc
}

/** A value given to a util: CSS text or a node that was already parsed (e.g. from a collector) */
export type Input = string | AstNode

export function as_value(input: Input): Value {
	return typeof input === 'string' ? parse_value(input) : (input as Value)
}

/** A selector list, or a single selector, as nodes. Throws a TypeError for anything else. */
export function as_selectors(input: Input): AstNode[] {
	if (typeof input === 'string') {
		let list: AstNode
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
export function as_prelude(name: string, input: Input): AstNode[] {
	return typeof input === 'string' ? parse_atrule_prelude(name, input) : [input]
}

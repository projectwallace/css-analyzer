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
	is_operator,
	is_atrule_prelude,
	is_container_query,
	is_declaration,
	is_function,
	is_identifier,
	is_media_feature,
	is_attribute_selector,
	is_type_selector,
	is_pseudo_class_selector,
	is_pseudo_element_selector,
	str_equals,
	str_starts_with,
	is_url,
	STYLESHEET,
	STYLE_RULE,
	AT_RULE,
	SELECTOR,
	DECLARATION,
	SUPPORTS_DECLARATION,
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

export type NodeKind =
	| 'stylesheet'
	| 'rule'
	| 'atrule'
	| 'selector'
	| 'declaration'
	| 'supports_declaration'
	| 'other'

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
		case SUPPORTS_DECLARATION:
			return 'supports_declaration'
		case SELECTOR:
			return 'selector'
		case STYLESHEET:
			return 'stylesheet'
		default:
			return 'other'
	}
}

export function get_value_kind(node: AstNode): ValueKind {
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
		// The callback also receives the VALUE node itself
		if (node.type !== value.type || node.start !== value.start) visit(node, get_value_kind(node))
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

/** `name` of identifiers, functions, at-rules, ... (empty string if the node has none) */
export function get_name(node: AstNode): string {
	return (node as { name?: string }).name ?? ''
}

/** The items of a comma/slash separated value, without the separators */
export function get_list_items(value: AstNode): AstNode[] {
	return Array.from(value as Value).filter((child) => !is_operator(child))
}

/** Unit of a dimension (`px` for `12px`) */
export function get_unit(node: AstNode): string {
	return (node as { unit?: string }).unit ?? ''
}

/** Text of the first child when that child is an identifier (e.g. `--x` in `var(--x)`) */
export function get_first_identifier(node: AstNode): string | undefined {
	const first = node.first_child
	return first && is_identifier(first) ? first.text : undefined
}

export type SelectorPart = {
	kind: 'attribute' | 'type' | 'pseudo_class' | 'pseudo_element'
	name: string
}

/** The attribute, type, pseudo-class and pseudo-element selectors inside a selector */
export function get_selector_parts(selector: AstNode): SelectorPart[] {
	const parts: SelectorPart[] = []
	walk(selector, function (node) {
		if (is_attribute_selector(node)) {
			parts.push({ kind: 'attribute', name: node.name })
		} else if (is_type_selector(node)) {
			parts.push({ kind: 'type', name: node.name })
		} else if (is_pseudo_class_selector(node)) {
			parts.push({ kind: 'pseudo_class', name: node.name })
		} else if (is_pseudo_element_selector(node)) {
			parts.push({ kind: 'pseudo_element', name: node.name })
		}
	})
	return parts
}

export type RuleParts = {
	/** The selectors in the prelude; empty when selectors are not parsed */
	selectors: AstNode[]
	declarations: number
	is_empty: boolean
}

export function get_rule_parts(rule: AstNode): RuleParts {
	const { prelude, block } = rule as { prelude?: AstNode; block?: AstNode }
	const selectors = prelude && is_selector_list(prelude) ? Array.from(prelude) : []
	let declarations = 0
	for (const child of (block as Iterable<AstNode> | undefined) ?? []) {
		if (is_declaration(child)) declarations++
	}
	return {
		selectors: selectors.filter((selector) => is_selector(selector)),
		declarations,
		is_empty: (block as { is_empty?: boolean } | undefined)?.is_empty === true,
	}
}

/** Children of a rule prelude's selector list (keyframe selectors like `from`, `50%`) */
export function get_prelude_items(rule: AstNode): AstNode[] {
	const { prelude } = rule as { prelude?: AstNode }
	return prelude && is_selector_list(prelude) ? Array.from(prelude) : []
}

export type AtruleParts = {
	/** Name as written, without `@` */
	name: string
	prelude_text: string | undefined
	has_block: boolean
	is_vendor_prefixed: boolean
}

export function get_atrule_parts(node: AstNode): AtruleParts {
	const atrule = node as Atrule
	return {
		name: atrule.name ?? '',
		prelude_text: atrule.has_prelude ? atrule.prelude.text : undefined,
		has_block: Boolean(atrule.block),
		is_vendor_prefixed: atrule.is_vendor_prefixed,
	}
}

/** `property: value` descriptors inside an at-rule block (e.g. `@font-face`) */
export function get_descriptors(node: AstNode): Record<string, string> {
	const descriptors: Record<string, string> = Object.create(null)
	for (const child of (node as Atrule).block?.children ?? []) {
		if (is_declaration(child) && child.value) {
			descriptors[child.property] = child.value.text
		}
	}
	return descriptors
}

/** Media features (`(min-width: 40em)`) anywhere in an at-rule prelude */
export function find_media_features(node: AstNode): AstNode[] {
	const atrule = node as Atrule
	const found: AstNode[] = []
	if (!atrule.has_prelude) return found
	walk(atrule.prelude, function (child) {
		if (is_media_feature(child)) {
			found.push(child)
			return SKIP
		}
	})
	return found
}

/** Name of the media feature, lowercased */
export function get_feature_name(node: AstNode): string {
	return ((node as { property?: string }).property ?? '').toLowerCase()
}

/** The container name in `@container name (min-width: 1px)` */
export function get_container_query_name(node: AstNode): string | undefined {
	const atrule = node as Atrule
	if (!atrule.has_prelude) return undefined
	const prelude = atrule.prelude
	if (is_atrule_prelude(prelude) && is_container_query(prelude.first_child)) {
		const name = prelude.first_child.first_child
		if (name && is_identifier(name)) return name.text
	}
	return undefined
}

export type ImportFunction = { name: 'supports' | 'layer'; value: string; node: AstNode }

/** `supports(...)` and `layer(...)` in an `@import` prelude */
export function get_import_functions(node: AstNode): ImportFunction[] {
	const atrule = node as Atrule
	const found: ImportFunction[] = []
	if (!atrule.has_prelude || !is_atrule_prelude(atrule.prelude) || !atrule.prelude.has_children) {
		return found
	}
	for (const child of atrule.prelude) {
		if (!is_function(child) || !child.value) continue
		if (str_equals('supports', child.name)) {
			found.push({ name: 'supports', value: child.value, node: child })
		} else if (str_equals('layer', child.name)) {
			found.push({ name: 'layer', value: child.value, node: child })
		}
	}
	return found
}

/** Property as written, e.g. `-WEBKIT-Transition` */
export function get_raw_property(node: AstNode): string {
	return (node as Declaration).property ?? ''
}

/** The `data:` URI inside a `url()` value, or `undefined` for regular URLs */
export function get_data_uri(node: AstNode): string | undefined {
	const value = (node as { value?: string | null }).value ?? ''
	const embed = value.replaceAll(/(?:^['"])|(?:['"]$)/g, '')
	return is_url(node) && str_starts_with('data:', embed) ? embed : undefined
}

/** The prelude node of an at-rule (`(min-width: 40em)` in `@media (min-width: 40em)`) */
export function get_prelude(node: AstNode): AstNode | undefined {
	const atrule = node as Atrule
	return atrule.has_prelude ? atrule.prelude : undefined
}

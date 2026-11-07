import {
	type Atrule,
	type CSSNode,
	type Declaration,
	type Rule,
	type Selector,
	type StyleSheet,
	AT_RULE,
	DECLARATION,
	DIMENSION,
	FUNCTION,
	HASH,
	IDENTIFIER,
	NUMBER,
	OPERATOR,
	PARENTHESIS,
	RATIO,
	SELECTOR,
	SKIP,
	STRING,
	STYLE_RULE,
	STYLESHEET,
	SUPPORTS_DECLARATION,
	UNICODE_RANGE,
	URL,
	parse,
	traverse,
	walk,
} from '@projectwallace/css-parser'
import { create_context } from './context.js'
import type {
	AddOptions,
	Analyzer,
	CollectorInstance,
	CollectorMap,
	Context,
	DeclarationContext,
	DeclarationHandler,
	ResultOf,
	StylesheetContext,
	ParseOptions,
	ValueKind,
} from './types.js'

type NodeKind =
	| 'stylesheet'
	| 'rule'
	| 'atrule'
	| 'selector'
	| 'declaration'
	| 'supports_declaration'
	| 'other'

function get_kind(node: CSSNode): NodeKind {
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

function get_value_kind(node: CSSNode): ValueKind {
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

type DeclarationSubscription = {
	properties: ReadonlySet<string> | undefined
	enter: DeclarationHandler
}

type ValueSubscription = {
	properties: ReadonlySet<string> | undefined
	enter: (node: CSSNode, ctx: DeclarationContext, kind: ValueKind) => void
}

/** Results remember which collectors produced them so `merge(a, b)` needs no extra arguments */
const registry = new WeakMap<object, CollectorMap>()

export function create_analyzer<C extends CollectorMap>(collectors: C): Analyzer<C> {
	const keys = Object.keys(collectors) as (keyof C & string)[]
	const instances: CollectorInstance<unknown>[] = keys.map((key) => collectors[key]!.create())

	// Build the dispatch table once: only subscribed handlers ever run
	const stylesheet_handlers: NonNullable<CollectorInstance<unknown>['stylesheet']>[] = []
	const rule_handlers: NonNullable<CollectorInstance<unknown>['rule']>[] = []
	const atrule_handlers: NonNullable<CollectorInstance<unknown>['atrule']>[] = []
	const selector_handlers: NonNullable<CollectorInstance<unknown>['selector']>[] = []
	const comment_handlers: NonNullable<CollectorInstance<unknown>['comment']>[] = []
	const declaration_handlers: DeclarationSubscription[] = []
	const value_handlers = new Map<ValueKind, ValueSubscription[]>()
	const parse_options: ParseOptions = { selectors: false, values: false, atrule_preludes: false }

	for (const instance of instances) {
		if (instance.parse?.selectors) parse_options.selectors = true
		if (instance.parse?.values) parse_options.values = true
		if (instance.parse?.atrule_preludes) parse_options.atrule_preludes = true

		if (instance.stylesheet) stylesheet_handlers.push(instance.stylesheet)
		if (instance.rule) rule_handlers.push(instance.rule)
		if (instance.atrule) atrule_handlers.push(instance.atrule)
		if (instance.comment) comment_handlers.push(instance.comment)
		if (instance.selector) {
			selector_handlers.push(instance.selector)
			parse_options.selectors = true
		}
		if (instance.declaration) {
			const declaration = instance.declaration
			declaration_handlers.push(
				typeof declaration === 'function'
					? { properties: undefined, enter: declaration }
					: { properties: declaration.properties, enter: declaration.enter },
			)
		}
		if (instance.value) {
			parse_options.values = true
			for (const type of instance.value.types) {
				const list = value_handlers.get(type) ?? []
				list.push({ properties: instance.value.properties, enter: instance.value.enter })
				value_handlers.set(type, list)
			}
		}
	}

	const needs_declarations = declaration_handlers.length > 0 || value_handlers.size > 0
	const controller = create_context()
	const ctx = controller.ctx

	function visit_declaration(node: Declaration): void {
		controller.set_node(node)

		for (const handler of declaration_handlers) {
			if (!handler.properties || handler.properties.has(ctx.property)) {
				handler.enter(node, ctx)
			}
		}

		if (value_handlers.size === 0) return
		const value = ctx.value
		if (!value) return

		walk(value, function (value_node) {
			// The callback also receives the VALUE node itself
			if (value_node.type === value.type && value_node.start === value.start) return
			const kind = get_value_kind(value_node)
			const handlers = value_handlers.get(kind)
			if (!handlers) return
			for (const handler of handlers) {
				if (!handler.properties || handler.properties.has(ctx.property)) {
					handler.enter(value_node, ctx, kind)
				}
			}
		})
	}

	function enter(node: CSSNode, kind: NodeKind): boolean | void {
		switch (kind) {
			case 'declaration':
				if (needs_declarations) visit_declaration(node as Declaration)
				// Value nodes are handled by the single value walk above
				return true
			case 'supports_declaration':
				// `@supports (display: grid)`: a condition, not a declaration
				return true
			case 'rule':
				controller.set_node(node)
				for (const handler of rule_handlers) handler(node as Rule, ctx as Context)
				controller.enter_rule(node)
				break
			case 'atrule':
				controller.set_node(node)
				for (const handler of atrule_handlers) handler(node as Atrule, ctx as Context)
				controller.enter_atrule(node)
				break
			case 'selector':
				if (selector_handlers.length > 0) {
					controller.set_node(node)
					for (const handler of selector_handlers) handler(node as Selector, ctx as Context)
				}
				// Selectors nested in :is(), :not(), ... belong to the selector that holds them
				return true
			default:
				break
		}
	}

	function leave(_node: CSSNode, kind: NodeKind): void {
		if (kind === 'rule') controller.leave_rule()
		else if (kind === 'atrule') controller.leave_atrule()
	}

	const analyzer: Analyzer<C> = {
		parse_options,
		add(input: string | CSSNode, options: AddOptions = {}): Analyzer<C> {
			let ast: CSSNode
			let css: string
			if (typeof input === 'string') {
				css = input
				controller.begin(options.source, css)
				ast = parse(css, {
					parse_selectors: parse_options.selectors,
					parse_values: parse_options.values,
					parse_atrule_preludes: parse_options.atrule_preludes,
					on_comment:
						comment_handlers.length === 0
							? undefined
							: function (comment) {
									const loc = {
										line: comment.line,
										column: comment.column,
										offset: comment.start,
										length: comment.length,
										...(options.source === undefined ? {} : { source: options.source }),
									}
									for (const handler of comment_handlers) handler(loc)
								},
				})
			} else {
				ast = input
				css = ast.text
				controller.begin(options.source, css)
			}

			if (stylesheet_handlers.length > 0) {
				controller.set_node(ast)
				for (const handler of stylesheet_handlers)
					handler(ast as StyleSheet, ctx as StylesheetContext)
			}

			traverse(ast, {
				enter(node) {
					return enter(node, get_kind(node)) === true ? SKIP : undefined
				},
				leave(node) {
					leave(node, get_kind(node))
				},
			})
			return analyzer
		},
		result(): ResultOf<C> {
			const result: Record<string, unknown> = {}
			keys.forEach(function (key, index) {
				result[key] = instances[index]!.result()
			})
			registry.set(result, collectors)
			return result as ResultOf<C>
		},
	}

	return analyzer
}

export function analyze<C extends CollectorMap>(
	input: string | CSSNode,
	collectors: C,
	options?: AddOptions,
): ResultOf<C> {
	return create_analyzer(collectors).add(input, options).result()
}

/**
 * Combine two results that were computed independently (workers, separate pages, coverage runs).
 * Pass `collectors` explicitly for results that lost their origin (e.g. after structuredClone).
 */
export function merge<R extends object>(a: R, b: R, collectors?: CollectorMap): R {
	const map = collectors ?? registry.get(a) ?? registry.get(b)
	if (!map) {
		throw new Error(
			'merge(): cannot find the collectors for these results. Pass them as the third argument.',
		)
	}
	const merged: Record<string, unknown> = {}
	for (const key of Object.keys(map)) {
		merged[key] = map[key]!.merge(
			(a as Record<string, unknown>)[key],
			(b as Record<string, unknown>)[key],
		)
	}
	registry.set(merged, map)
	return merged as R
}

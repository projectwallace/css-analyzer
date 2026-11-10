import {
	type AnyNode,
	type Declaration,
	type StyleSheet,
	AT_RULE,
	DECLARATION,
	SELECTOR,
	SELECTOR_LIST,
	SKIP,
	STYLE_RULE,
	SUPPORTS_DECLARATION,
	parse,
	traverse,
	walk_selectors,
	walk_values,
} from '@projectwallace/css-parser'
import { create_context } from './context.ts'
import type { CollectorInstance, CollectorMap, ResultOf, ParseOptions } from './types.ts'

// Keyframe selectors (`from`, `50%`) are not selectors in the sense of the selector metrics
const KEYFRAMES = new Set<Lowercase<string>>(['keyframes'])

type DeclarationSubscription = NonNullable<CollectorInstance<unknown>['declaration']>
type ValueSubscription = Omit<NonNullable<CollectorInstance<unknown>['value']>, 'types'>

/**
 * Run collectors over one stylesheet.
 *
 * This is a single-pass, multiplexed visitor (the same pattern as ESLint rule listeners or
 * PostCSS 8 plugin visitors): every collector subscribes to the node types it cares about,
 * the subscriptions are merged into one dispatch table, and the AST is traversed once for all
 * collectors. Each declaration value is walked once as well, for every value subscriber.
 *
 * Handlers receive a shared context object (see `create_context()`): a flyweight whose facts
 * (normalized property, parsed value, font shorthand, ...) are computed lazily and memoized per
 * node, so the first collector that asks pays and the others read the cached result. The
 * context is only valid during the handler call it is passed to.
 * @param input - CSS text, or an already parsed stylesheet (the result of the parser's `parse()`)
 * @param collectors - Object map of collectors; the keys become the keys of the result
 */
export function analyze<C extends CollectorMap>(
	input: string | StyleSheet,
	collectors: C,
): ResultOf<C> {
	const keys = Object.keys(collectors)
	const instances: CollectorInstance<unknown>[] = keys.map((key) => collectors[key]!.create())

	// Build the dispatch table once: only subscribed handlers ever run
	const stylesheet_handlers: NonNullable<CollectorInstance<unknown>['stylesheet']>[] = []
	const rule_handlers: NonNullable<CollectorInstance<unknown>['rule']>[] = []
	const atrule_handlers: NonNullable<CollectorInstance<unknown>['atrule']>[] = []
	const selector_handlers: NonNullable<CollectorInstance<unknown>['selector']>[] = []
	const comment_handlers: NonNullable<CollectorInstance<unknown>['comment']>[] = []
	const declaration_handlers: DeclarationSubscription[] = []
	const value_handlers = new Map<number, ValueSubscription[]>()
	const parse_options: ParseOptions = { selectors: false, values: false, atrule_preludes: false }

	for (const instance of instances) {
		if (instance.parse?.selectors) {
			parse_options.selectors = true
		}
		if (instance.parse?.values) {
			parse_options.values = true
		}
		if (instance.parse?.atrule_preludes) {
			parse_options.atrule_preludes = true
		}

		if (instance.stylesheet) {
			stylesheet_handlers.push(instance.stylesheet)
		}
		if (instance.rule) {
			rule_handlers.push(instance.rule)
		}
		if (instance.atrule) {
			atrule_handlers.push(instance.atrule)
		}
		if (instance.comment) {
			comment_handlers.push(instance.comment)
		}
		if (instance.selector) {
			selector_handlers.push(instance.selector)
			parse_options.selectors = true
		}
		if (instance.declaration) {
			declaration_handlers.push(instance.declaration)
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

	function visit_declaration(node: Declaration, depth: number): void {
		controller.set_node(node, depth)

		for (const handler of declaration_handlers) {
			if (!handler.properties || handler.properties.has(ctx.property)) {
				handler.enter(node, ctx)
			}
		}

		if (value_handlers.size === 0) {
			return
		}
		// Visits nothing when values are not parsed
		walk_values(node, function (value_node) {
			const handlers = value_handlers.get(value_node.type)
			if (!handlers) {
				return
			}
			for (const handler of handlers) {
				if (!handler.properties || handler.properties.has(ctx.property)) {
					handler.enter(value_node, ctx)
				}
			}
		})
	}

	function enter(node: AnyNode, depth: number): boolean | void {
		switch (node.type) {
			case DECLARATION:
				if (needs_declarations) {
					visit_declaration(node, depth)
				}
				// Value nodes are handled by the single value walk above
				return true
			case SUPPORTS_DECLARATION:
				// `@supports (display: grid)`: a condition, not a declaration
				return true
			case STYLE_RULE:
				controller.set_node(node, depth)
				for (const handler of rule_handlers) {
					handler(node, ctx)
				}
				break
			case AT_RULE:
				controller.set_node(node, depth)
				for (const handler of atrule_handlers) {
					handler(node, ctx)
				}
				controller.enter_atrule(node)
				break
			case SELECTOR_LIST:
			case SELECTOR:
				// Selectors have their own walk (see `walk_selectors` below)
				return true
			default:
				break
		}
	}

	function leave(node: AnyNode): void {
		if (node.type === AT_RULE) {
			controller.leave_atrule()
		}
	}

	let ast: StyleSheet
	if (typeof input === 'string') {
		controller.begin(input)
		ast = parse(input, {
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
							}
							for (const handler of comment_handlers) {
								handler(loc)
							}
						},
		})
	} else {
		ast = input
		controller.begin(ast.text)
	}

	if (stylesheet_handlers.length > 0) {
		controller.set_node(ast, 0)
		for (const handler of stylesheet_handlers) {
			handler(ast, ctx)
		}
	}

	traverse(ast, {
		enter(node, depth) {
			return enter(node, depth) === true ? SKIP : undefined
		},
		leave,
	})

	if (selector_handlers.length > 0) {
		walk_selectors(
			ast,
			function (selector) {
				for (const handler of selector_handlers) {
					handler(selector)
				}
			},
			{ skip_atrules: KEYFRAMES, skip_atrule_preludes: true },
		)
	}

	const result: Record<string, unknown> = Object.create(null)
	keys.forEach(function (key, index) {
		result[key] = instances[index]!.result()
	})
	// The one cast left: TypeScript cannot relate keys that are only known at runtime to the mapped type
	return result as ResultOf<C>
}

import type {
	Atrule,
	CSSNode,
	Declaration,
	Rule,
	Selector,
	StyleSheet,
	Value,
} from '@projectwallace/css-parser'
import type { Location } from '../utils/location.ts'
import type { FontShorthand } from '../values/destructure-font-shorthand.ts'

export type { CSSNode }

export type { Location }

/** What the parser has to parse: the engine asks only for what the collectors need */
export type ParseOptions = {
	selectors: boolean
	values: boolean
	atrule_preludes: boolean
}

export type CountEntry = {
	count: number
	/** Only present if the collector was created with `{ locations: true }` */
	locations?: Location[]
}

/** Unique items with how often (and where) each was found */
export type CountMap<T extends CountItem = string> = Map<T, CountEntry>

/** What can be counted: text (properties, selectors, values) or numbers (complexity, nesting). Never both. */
export type CountItem = string | number

/** The one and only way counted things are reported */
export type CountResult<T extends CountItem = string> = {
	total: number
	total_unique: number
	unique: CountMap<T>
	/** Every counted item in the order it was found. Only present with `{ sequence: true }`. */
	sequence?: T[]
}

export type ContextCountResult<T extends CountItem = string> = CountResult<T> & {
	by_context: Map<string, CountResult<T>>
}

type ByContext = Pick<ContextCountResult, 'by_context'>

/**
 * The result of a collector that can count per context: `by_context` exists exactly when
 * the `contexts` option is `true`, and is optional when the option is only known to be a boolean.
 */
export type WithContexts<
	R extends CountResult<CountItem>,
	O extends ContextCountOptions,
> = 'contexts' extends keyof O
	? [O['contexts' & keyof O]] extends [true]
		? R & ByContext
		: [O['contexts' & keyof O]] extends [false | undefined]
			? R
			: R & Partial<ByContext>
	: R

export type CountOptions = {
	/** Also keep where every item was found (`unique.get(item).locations`). Costs memory; off by default. */
	locations?: boolean
	/** Also keep every counted item in order (`result.sequence`). Costs memory; off by default. */
	sequence?: boolean
}

export type ContextCountOptions = CountOptions & {
	/** Also count per context (e.g. per property) in `by_context`. Without it there is no `by_context`. */
	contexts?: boolean
	/**
	 * How properties are named in `by_context`: `normalized` (default: lowercase, no vendor prefix or hack
	 * character, so `-webkit-box-shadow` is `box-shadow`) or `as_written`.
	 */
	property?: 'normalized' | 'as_written'
}

/** Facts and structure about the node that is currently visited */
export type Context = {
	/** Number of enclosing rules/at-rules */
	readonly depth: number
	/** Lowercased, unprefixed names of the enclosing at-rules, outermost first */
	readonly atrule_stack: readonly string[]
}

export type StylesheetContext = Context & {
	/** Full source text of the stylesheet */
	readonly css: string
}

export type DeclarationContext = Context & {
	/** Normalized property: lowercased, without vendor prefix or hack character (custom properties untouched) */
	readonly property: string
	/** Property as written (`-WEBKIT-Transition`) */
	readonly raw_property: string
	readonly is_custom: boolean
	readonly is_important: boolean
	readonly is_browserhack: boolean
	readonly is_vendor_prefixed: boolean
	/** Raw value text, also available when values are not parsed */
	readonly value_text: string
	/** Parsed value node, `undefined` when values are not parsed (see `parse.values`) */
	readonly value: Value | undefined
	/**
	 * Value text without a trailing IE hack (`\\9`, `\\7`). `undefined` when the value is not parsed
	 * or is a global keyword (`inherit`, `initial`, `none`, ...).
	 */
	readonly clean_value_text: string | undefined
	/**
	 * The `font` shorthand split into size, line-height and family; shared by every collector that asks.
	 * `null` for other properties, system fonts, global keywords and values that cannot be split (`var()`).
	 */
	readonly font_shorthand: FontShorthand | null
}

type DeclarationHandler = (node: Declaration, ctx: DeclarationContext) => void

/**
 * What a collector subscribes to. The engine walks the CSS once and calls only the handlers that exist.
 *
 * The `ctx` that handlers receive is ONE shared, mutable object that the engine reuses for every node
 * (facts are computed lazily and cached per node). It is only valid during the handler call: read what
 * you need from it right away and never store `ctx` (or a node) for later, or you will read the data
 * of a different node. Copy values (strings, numbers) instead.
 */
export type CollectorInstance<T> = {
	/** Extra parsing this collector needs. Selectors/values are implied by `selector`/`value` subscriptions. */
	parse?: Partial<ParseOptions>
	stylesheet?: (node: StyleSheet, ctx: StylesheetContext) => void
	rule?: (node: Rule, ctx: Context) => void
	atrule?: (node: Atrule, ctx: Context) => void
	/**
	 * Every selector of a style rule, except those in `@keyframes` (keyframe selectors are `rule`s
	 * inside `@keyframes`) and those in at-rule preludes (`@scope`, `@supports selector()`).
	 * It gets no context: use `rule` when you need `ctx.depth` or `ctx.atrule_stack`.
	 */
	selector?: (node: Selector) => void
	declaration?: {
		/** Normalized property names; the handler is skipped for other declarations */
		properties?: ReadonlySet<string>
		enter: DeclarationHandler
	}
	/** Subscribe to nodes inside declaration values; the engine walks each value once for all collectors */
	value?: {
		/** Parser node types, e.g. `[HASH, FUNCTION]` */
		types: readonly number[]
		properties?: ReadonlySet<string>
		enter: (node: CSSNode, ctx: DeclarationContext) => void
	}
	/**
	 * Called for every comment. Only works when `analyze()` gets CSS text: the parser reports comments
	 * while parsing, so an AST that was parsed elsewhere gives no comments (no error, the handler never runs).
	 */
	comment?: (loc: Location) => void
	/** Build the result. Keep it separate from internal state; it can be called repeatedly. */
	result(): T
}

export type CollectorDef<T> = {
	create(): CollectorInstance<T>
}

// oxlint-disable-next-line no-explicit-any
type AnyCollectorDef = CollectorDef<any>
export type CollectorMap = Record<string, AnyCollectorDef>

export type ResultOf<C extends CollectorMap> = {
	[K in keyof C]: C[K] extends CollectorDef<infer T> ? T : never
}

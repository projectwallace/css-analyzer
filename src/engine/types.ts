import type {
	Atrule,
	CSSNode,
	Declaration,
	Rule,
	Selector,
	StyleSheet,
	Value,
} from '@projectwallace/css-parser'
import type { FontShorthand } from '../values/destructure-font-shorthand.js'

export type { CSSNode }

export type Location = {
	line: number
	column: number
	offset: number
	length: number
	/** File name, `undefined` unless the input was added with `{ source }` */
	source?: string
}

/** What the parser has to parse: the engine asks only for what the collectors need */
export type ParseOptions = {
	selectors: boolean
	values: boolean
	atrule_preludes: boolean
}

/** The kind of node inside a declaration value */
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

/** Anything that can tell the location of the node that is being processed */
export type LocationSource = { readonly loc: Location }

export type CountEntry = {
	count: number
	/** Only present if the collector was created with `{ locations: true }` */
	locations?: Location[]
}

/** The one and only way counted things are reported */
export type CountResult = {
	total: number
	total_unique: number
	unique: Map<string, CountEntry>
	/** Every counted item in the order it was found. Only present with `{ sequence: true }`. */
	sequence?: string[]
}

export type ContextCountResult = CountResult & {
	by_context: Map<string, CountResult>
}

export type CountOptions = {
	locations?: boolean
	/** Also keep every counted item in order (`result.sequence`). Costs memory; off by default. */
	sequence?: boolean
}

export type ContextCountOptions = CountOptions & {
	/** Also count per context (e.g. per property). Without it `by_context` stays empty. */
	contexts?: boolean
	/**
	 * How properties are named in `by_context`: `normalized` (default: lowercase, no vendor prefix or hack
	 * character, so `-webkit-box-shadow` is `box-shadow`) or `as_written`.
	 */
	property?: 'normalized' | 'as_written'
}

/** Facts and structure about the node that is currently visited */
export type Context = {
	/** File name passed to `add(css, { source })` */
	readonly source: string | undefined
	/** Number of enclosing rules/at-rules */
	readonly depth: number
	/** Lowercased, unprefixed names of the enclosing at-rules, outermost first */
	readonly atrule_stack: readonly string[]
	readonly parent_rule: CSSNode | undefined
	readonly in_keyframes: boolean
	/** Location of the current node */
	readonly loc: Location
	/** Location view for any other node; the returned object is reused, read `.loc` right away */
	at(node: CSSNode): LocationSource
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
	/** Location of the property name only */
	readonly property_loc: Location
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

export type DeclarationHandler = (node: Declaration, ctx: DeclarationContext) => void

export type CollectorInstance<T> = {
	/** Extra parsing this collector needs. Selectors/values are implied by `selector`/`value` subscriptions. */
	parse?: Partial<ParseOptions>
	stylesheet?: (node: StyleSheet, ctx: StylesheetContext) => void
	rule?: (node: Rule, ctx: Context) => void
	atrule?: (node: Atrule, ctx: Context) => void
	selector?: (node: Selector, ctx: Context) => void
	declaration?:
		| DeclarationHandler
		| {
				/** Normalized property names; the handler is skipped for other declarations */
				properties?: ReadonlySet<string>
				enter: DeclarationHandler
		  }
	/** Subscribe to nodes inside declaration values; the engine walks each value once for all collectors */
	value?: {
		types: readonly ValueKind[]
		properties?: ReadonlySet<string>
		enter: (node: CSSNode, ctx: DeclarationContext, kind: ValueKind) => void
	}
	/** Called for every comment. Only works when the engine parses the input itself. */
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

export type AnalyzeOptions = {
	/** Stored on every location, to tell stylesheets apart */
	source?: string
}

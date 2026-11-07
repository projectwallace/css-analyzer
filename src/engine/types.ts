import type { AstNode, Location, ParseOptions, ValueKind } from '../adapter/css-parser.js'
import type { FontShorthand } from '../values/destructure-font-shorthand.js'

export type { AstNode, Location, ParseOptions, ValueKind }

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
}

export type ContextCountResult = CountResult & {
	by_context: Map<string, CountResult>
}

export type CountOptions = {
	locations?: boolean
}

export type ContextCountOptions = CountOptions & {
	/** Also count per context (e.g. per property). Without it `by_context` stays empty. */
	contexts?: boolean
}

/** Facts and structure about the node that is currently visited */
export type Context = {
	/** File name passed to `add(css, { source })` */
	readonly source: string | undefined
	/** Number of enclosing rules/at-rules */
	readonly depth: number
	/** Lowercased, unprefixed names of the enclosing at-rules, outermost first */
	readonly atrule_stack: readonly string[]
	readonly parent_rule: AstNode | undefined
	readonly in_keyframes: boolean
	/** Location of the current node */
	readonly loc: Location
	/** Location view for any other node; the returned object is reused, read `.loc` right away */
	at(node: AstNode): LocationSource
}

export type StylesheetContext = Context & {
	/** Full source text of the stylesheet */
	readonly css: string
}

export type DeclarationContext = Context & {
	/** Normalized property: lowercased, without vendor prefix or hack character (custom properties untouched) */
	readonly property: string
	readonly is_custom: boolean
	readonly is_important: boolean
	readonly is_browserhack: boolean
	readonly is_vendor_prefixed: boolean
	/** Raw value text, also available when values are not parsed */
	readonly value_text: string
	/** Parsed value node, `undefined` when values are not parsed (see `parse.values`) */
	readonly value: AstNode | undefined
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

export type DeclarationHandler = (node: AstNode, ctx: DeclarationContext) => void

export type CollectorInstance<T> = {
	/** Extra parsing this collector needs. Selectors/values are implied by `selector`/`value` subscriptions. */
	parse?: Partial<ParseOptions>
	stylesheet?: (node: AstNode, ctx: StylesheetContext) => void
	rule?: (node: AstNode, ctx: Context) => void
	atrule?: (node: AstNode, ctx: Context) => void
	selector?: (node: AstNode, ctx: Context) => void
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
		enter: (node: AstNode, ctx: DeclarationContext, kind: ValueKind) => void
	}
	/** Called for every comment. Only works when the engine parses the input itself. */
	comment?: (loc: Location) => void
	/** Build the result. Keep it separate from internal state; it can be called repeatedly. */
	result(): T
}

export type CollectorDef<T> = {
	create(): CollectorInstance<T>
	merge(a: T, b: T): T
}

// oxlint-disable-next-line no-explicit-any
type AnyCollectorDef = CollectorDef<any>
export type CollectorMap = Record<string, AnyCollectorDef>

export type ResultOf<C extends CollectorMap> = {
	[K in keyof C]: C[K] extends CollectorDef<infer T> ? T : never
}

export type AddOptions = {
	source?: string
}

export type Analyzer<C extends CollectorMap> = {
	/** Parse options the collectors need; use them when you parse the AST yourself */
	readonly parse_options: ParseOptions
	add(input: string | AstNode, options?: AddOptions): Analyzer<C>
	result(): ResultOf<C>
}

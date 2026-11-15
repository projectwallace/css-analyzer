import type {
	Atrule,
	CSSNode,
	Declaration,
	Rule,
	Selector,
	StyleSheet,
	Value,
} from '@projectwallace/css-parser'
import type { Location, Match } from '../utils/location.ts'
import type { FontShorthand } from '../values/destructure-font-shorthand.ts'

export type { CSSNode }

export type { Location, Match }

export type ParseOptions = {
	selectors: boolean
	values: boolean
	atrule_preludes: boolean
}

export type CountEntry = {
	count: number
	/** Only with `locations: true` */
	locations?: Location[]
}

export type CountMap<T extends CountItem = string> = Map<T, CountEntry>

/** Text or numbers, never both */
export type CountItem = string | number

export type CountResult<T extends CountItem = string> = {
	total: number
	total_unique: number
	unique: CountMap<T>
	/** Only with `sequence: true` */
	sequence?: T[]
}

export type ContextCountResult<T extends CountItem = string> = CountResult<T> & {
	by_context: Map<string, CountResult<T>>
}

type ByContext = Pick<ContextCountResult, 'by_context'>

/** `by_context` exists when `contexts` is `true` */
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
	locations?: boolean
	sequence?: boolean
}

export type ContextCountOptions = CountOptions & {
	/** Also count per context (e.g. per property) in `by_context` */
	contexts?: boolean
	/** `normalized` (default) or `as_written` */
	property?: 'normalized' | 'as_written'
}

export type Context = {
	readonly depth: number
	/** Lowercased, unprefixed, outermost first */
	readonly atrule_stack: readonly string[]
}

export type StylesheetContext = Context & {
	readonly css: string
}

export type DeclarationContext = Context & {
	/** Lowercased, without vendor prefix or hack character */
	readonly property: string
	readonly raw_property: string
	readonly is_custom: boolean
	readonly is_important: boolean
	readonly is_browserhack: boolean
	readonly is_vendor_prefixed: boolean
	readonly value_text: string
	/** `undefined` when values are not parsed */
	readonly value: Value | undefined
	/** Without a trailing IE hack; `undefined` for global keywords */
	readonly clean_value_text: string | undefined
	/** `null` for other properties, system fonts and keywords */
	readonly font_shorthand: FontShorthand | null
}

type DeclarationHandler = (node: Declaration, ctx: DeclarationContext) => void

/** The `ctx` is shared: never store it or a node */
export type CollectorInstance<T> = {
	parse?: Partial<ParseOptions>
	stylesheet?: (node: StyleSheet, ctx: StylesheetContext) => void
	rule?: (node: Rule, ctx: Context) => void
	atrule?: (node: Atrule, ctx: Context) => void
	/** Style rule selectors only; no `ctx` */
	selector?: (node: Selector) => void
	declaration?: {
		/** Normalized names; other declarations are skipped */
		properties?: ReadonlySet<string>
		enter: DeclarationHandler
	}
	value?: {
		types: readonly number[]
		properties?: ReadonlySet<string>
		enter: (node: CSSNode, ctx: DeclarationContext) => void
	}
	comment?: (loc: Location) => void
	/** Can be called repeatedly */
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

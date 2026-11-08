import {
	type Atrule,
	type CSSNode,
	type Declaration,
	type Value,
	is_custom,
	is_raw,
	property_basename,
	strip_value_hack,
} from '@projectwallace/css-parser'
import {
	SYSTEM_FONTS,
	destructure_font_shorthand,
	type FontShorthand,
} from '../values/destructure-font-shorthand.ts'
import { keywords } from '../values/values.ts'
import type { DeclarationContext, StylesheetContext } from './types.ts'

export type ContextController = {
	/** One shared, mutable object: valid only during the handler call it is passed to */
	readonly ctx: DeclarationContext & StylesheetContext
	begin(css: string): void
	/** `depth`: the number of enclosing rules and at-rules, as reported by `traverse()` */
	set_node(node: CSSNode, depth: number): void
	enter_atrule(node: CSSNode): void
	leave_atrule(): void
}

/** Cache marker for facts whose computed value can itself be `undefined` or `null` */
const NOT_COMPUTED = Symbol('not-computed-yet')

/**
 * Builds the shared context object. Facts are lazy and memoized per node:
 * whoever asks first pays, everybody else reads the cached value.
 */
export function create_context(): ContextController {
	let css = ''
	let node: CSSNode | undefined
	let property_cache: string | undefined
	let raw_property_cache: string | undefined
	let value_text_cache: string | undefined
	let value_cache: Value | undefined | typeof NOT_COMPUTED = NOT_COMPUTED
	let clean_text_cache: string | undefined | typeof NOT_COMPUTED = NOT_COMPUTED
	let font_cache: FontShorthand | null | typeof NOT_COMPUTED = NOT_COMPUTED
	const atrule_stack: string[] = []
	let depth = 0

	const ctx: DeclarationContext & StylesheetContext = {
		get css() {
			return css
		},
		get depth() {
			return depth
		},
		get atrule_stack() {
			return atrule_stack
		},
		get property() {
			property_cache ??= property_basename(ctx.raw_property)
			return property_cache
		},
		get raw_property() {
			raw_property_cache ??= (node as Declaration).property ?? ''
			return raw_property_cache
		},
		get is_custom() {
			return is_custom(ctx.raw_property)
		},
		get is_important() {
			return (node as Declaration).is_important
		},
		get is_browserhack() {
			return (node as Declaration).is_browserhack
		},
		get is_vendor_prefixed() {
			return (node as Declaration).is_vendor_prefixed
		},
		get value_text() {
			value_text_cache ??= (node as Declaration).value?.text ?? ''
			return value_text_cache
		},
		get clean_value_text() {
			if (clean_text_cache === NOT_COMPUTED) {
				const text = ctx.value_text
				clean_text_cache =
					ctx.value && !keywords.has(text)
						? ctx.is_custom
							? text
							: strip_value_hack(text)
						: undefined
			}
			return clean_text_cache
		},
		get font_shorthand() {
			if (font_cache === NOT_COMPUTED) {
				const text = ctx.clean_value_text
				font_cache =
					ctx.property === 'font' && text !== undefined && !SYSTEM_FONTS.has(text)
						? destructure_font_shorthand(ctx.value!)
						: null
			}
			return font_cache
		},
		get value() {
			if (value_cache === NOT_COMPUTED) {
				// Values that were not parsed (see `parse.values`) are RAW nodes
				const value = (node as Declaration).value
				value_cache = value && !is_raw(value) ? (value as Value) : undefined
			}
			return value_cache
		},
	}

	return {
		ctx,
		begin(next_css) {
			css = next_css
			node = undefined
			depth = 0
			atrule_stack.length = 0
		},
		set_node(next, next_depth) {
			node = next
			depth = next_depth
			property_cache = undefined
			raw_property_cache = undefined
			value_text_cache = undefined
			value_cache = NOT_COMPUTED
			clean_text_cache = NOT_COMPUTED
			font_cache = NOT_COMPUTED
		},
		enter_atrule(atrule) {
			atrule_stack.push(property_basename((atrule as Atrule).name ?? ''))
		},
		leave_atrule() {
			atrule_stack.pop()
		},
	}
}

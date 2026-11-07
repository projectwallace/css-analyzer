import {
	type Atrule,
	type CSSNode,
	type Declaration,
	type Value,
	is_custom,
	is_raw,
} from '@projectwallace/css-parser'
import { basename } from '../properties/property-utils.js'
import {
	SYSTEM_FONTS,
	destructure_font_shorthand,
	type FontShorthand,
} from '../values/destructure-font-shorthand.js'
import { keywords } from '../values/values.js'
import type { DeclarationContext, Location, LocationSource, StylesheetContext } from './types.js'

export type ContextController = {
	/** One shared, mutable object: valid only during the handler call it is passed to */
	readonly ctx: DeclarationContext & StylesheetContext
	begin(source: string | undefined, css: string): void
	set_node(node: CSSNode): void
	enter_rule(node: CSSNode): void
	leave_rule(): void
	enter_atrule(node: CSSNode): void
	leave_atrule(): void
}

/**
 * Builds the shared context object. Facts are lazy and memoized per node:
 * whoever asks first pays, everybody else reads the cached value.
 */
export function create_context(): ContextController {
	let source: string | undefined
	let css = ''
	let node: CSSNode | undefined
	let property_cache: string | undefined
	let value_node: Value | undefined
	let value_loaded = false
	let clean_loaded = false
	let clean_text: string | undefined
	let font_loaded = false
	let font_result: FontShorthand | null = null
	let view_node: CSSNode | undefined
	let keyframes_count = 0
	const atrule_stack: string[] = []
	const rule_stack: CSSNode[] = []
	let depth = 0

	function get_location(target: CSSNode): Location {
		const loc: Location = {
			line: target.line,
			column: target.column,
			offset: target.start,
			length: target.length,
		}
		if (source !== undefined) {
			loc.source = source
		}
		return loc
	}

	const view: LocationSource = {
		get loc(): Location {
			return get_location(view_node!)
		},
	}

	const ctx: DeclarationContext & StylesheetContext = {
		get source() {
			return source
		},
		get css() {
			return css
		},
		get depth() {
			return depth
		},
		get atrule_stack() {
			return atrule_stack
		},
		get parent_rule() {
			return rule_stack.at(-1)
		},
		get in_keyframes() {
			return keyframes_count > 0
		},
		get loc() {
			return get_location(node!)
		},
		at(other) {
			view_node = other
			return view
		},
		get property() {
			property_cache ??= basename(ctx.raw_property)
			return property_cache
		},
		get raw_property() {
			return (node as Declaration).property ?? ''
		},
		get property_loc() {
			return { ...get_location(node!), length: ctx.raw_property.length }
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
			return (node as Declaration).value?.text ?? ''
		},
		get clean_value_text() {
			if (!clean_loaded) {
				clean_loaded = true
				const text = ctx.value_text
				if (ctx.value && !keywords.has(text)) {
					clean_text =
						!ctx.is_custom && (text.endsWith('\\9') || text.endsWith('\\7'))
							? text.slice(0, -2)
							: text
				} else {
					clean_text = undefined
				}
			}
			return clean_text
		},
		get font_shorthand() {
			if (!font_loaded) {
				font_loaded = true
				const text = ctx.clean_value_text
				font_result =
					ctx.property === 'font' && text !== undefined && !SYSTEM_FONTS.has(text)
						? destructure_font_shorthand(ctx.value!)
						: null
			}
			return font_result
		},
		get value() {
			if (!value_loaded) {
				// Values that were not parsed (see `parse.values`) are RAW nodes
				const value = (node as Declaration).value
				value_node = value && !is_raw(value) ? (value as Value) : undefined
				value_loaded = true
			}
			return value_node
		},
	}

	return {
		ctx,
		begin(next_source, next_css) {
			source = next_source
			css = next_css
			node = undefined
			depth = 0
			keyframes_count = 0
			atrule_stack.length = 0
			rule_stack.length = 0
		},
		set_node(next) {
			node = next
			property_cache = undefined
			value_node = undefined
			value_loaded = false
			clean_loaded = false
			font_loaded = false
		},
		enter_rule(rule) {
			rule_stack.push(rule)
			depth++
		},
		leave_rule() {
			rule_stack.pop()
			depth--
		},
		enter_atrule(atrule) {
			const name = basename((atrule as Atrule).name ?? '')
			atrule_stack.push(name)
			if (name === 'keyframes') {
				keyframes_count++
			}
			depth++
		},
		leave_atrule() {
			const name = atrule_stack.pop()
			if (name === 'keyframes') {
				keyframes_count--
			}
			depth--
		},
	}
}

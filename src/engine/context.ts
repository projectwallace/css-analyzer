import {
	type AstNode,
	type DeclarationFacts,
	get_atrule_name,
	get_declaration_facts,
	get_declaration_value,
	get_declaration_value_text,
	get_location,
	is_custom_property,
} from '../adapter/css-parser.js'
import type { DeclarationContext, Location, LocationSource, StylesheetContext } from './types.js'

export type ContextController = {
	/** One shared, mutable object: valid only during the handler call it is passed to */
	readonly ctx: DeclarationContext & StylesheetContext
	begin(source: string | undefined, css: string): void
	set_node(node: AstNode): void
	enter_rule(node: AstNode): void
	leave_rule(): void
	enter_atrule(node: AstNode): void
	leave_atrule(): void
	location_of(node: AstNode): Location
}

/**
 * Builds the shared context object. Facts are lazy and memoized per node:
 * whoever asks first pays, everybody else reads the cached value.
 */
export function create_context(): ContextController {
	let source: string | undefined
	let css = ''
	let node: AstNode | undefined
	let facts: DeclarationFacts | undefined
	let value_node: AstNode | undefined
	let value_loaded = false
	let view_node: AstNode | undefined
	let keyframes_count = 0
	const atrule_stack: string[] = []
	const rule_stack: AstNode[] = []
	let depth = 0

	function get_facts(): DeclarationFacts {
		facts ??= get_declaration_facts(node!)
		return facts
	}

	const view: LocationSource = {
		get loc(): Location {
			return get_location(view_node!, source)
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
			return get_location(node!, source)
		},
		at(other) {
			view_node = other
			return view
		},
		get property() {
			return get_facts().property
		},
		get is_custom() {
			return is_custom_property(node!)
		},
		get is_important() {
			return get_facts().is_important
		},
		get is_browserhack() {
			return get_facts().is_browserhack
		},
		get is_vendor_prefixed() {
			return get_facts().is_vendor_prefixed
		},
		get value_text() {
			return get_declaration_value_text(node!)
		},
		get value() {
			if (!value_loaded) {
				value_node = get_declaration_value(node!)
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
			facts = undefined
			value_node = undefined
			value_loaded = false
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
			const name = get_atrule_name(atrule)
			atrule_stack.push(name)
			if (name === 'keyframes') keyframes_count++
			depth++
		},
		leave_atrule() {
			const name = atrule_stack.pop()
			if (name === 'keyframes') keyframes_count--
			depth--
		},
		location_of(other) {
			return get_location(other, source)
		},
	}
}

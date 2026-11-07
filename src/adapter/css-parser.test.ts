import { test, expect } from 'vitest'
import {
	as_prelude,
	as_selectors,
	as_value,
	get_atrule_name,
	get_data_uri,
	get_declaration_facts,
	get_descriptors,
	get_location,
	get_rule_parts,
	get_selector_parts,
	parse_css,
	walk_ast,
	walk_value,
} from './css-parser.js'

const everything = { selectors: true, values: true, atrule_preludes: true }

function first(css: string, kind: 'rule' | 'atrule' | 'declaration', options = everything) {
	const found: ReturnType<typeof parse_css>[] = []
	walk_ast(
		parse_css(css, options),
		(node, node_kind) => {
			found.push(...(node_kind === kind ? [node] : []))
		},
		() => {},
	)
	return found[0]!
}

function declaration_value_text(css: string, options = everything): string {
	return (first(css, 'declaration', options) as unknown as { value: { text: string } }).value.text
}

function kinds_of(css: string): string[] {
	const kinds: string[] = []
	walk_ast(
		parse_css(css, everything),
		(_node, kind) => {
			kinds.push(kind)
			return kind === 'atrule'
		},
		() => {},
	)
	return kinds.filter((kind) => kind !== 'other')
}

function value_kinds(value: string): string[] {
	const kinds: string[] = []
	walk_value(as_value(value), (_node, kind) => {
		kinds.push(kind)
	})
	return kinds
}

function data_uris(value: string): (string | undefined)[] {
	const nodes: Parameters<typeof get_data_uri>[0][] = []
	walk_value(as_value(value), (node, kind) => {
		nodes.push(...(kind === 'url' ? [node] : []))
	})
	return nodes.map((node) => get_data_uri(node))
}

test('parse_css leaves values raw when they are not asked for', () => {
	const raw = { selectors: false, values: false, atrule_preludes: false }
	expect(declaration_value_text('a { color: red }', raw)).toBe('red')
})

test('parse_css reports comments', () => {
	const comments: number[] = []
	parse_css('/* a */ a {} /* bb */', everything, (comment) => comments.push(comment.length))
	expect(comments).toEqual([7, 8])
})

test('walk_ast tells the kind of each node and can skip children', () => {
	expect(kinds_of('@media (x) { a { color: red } }')).toEqual(['stylesheet', 'atrule'])
})

test('walk_value reports the nodes of a value but not the value itself', () => {
	expect(value_kinds('1px solid #fff url(a.png) calc(1px + 2px)').slice(0, 5)).toEqual([
		'dimension',
		'identifier',
		'hash',
		'url',
		'function',
	])
})

test('as_value, as_selectors and as_prelude parse text and pass nodes through', () => {
	const value = as_value('1px')
	expect(as_value(value)).toBe(value)

	const selectors = as_selectors('a, b.c')
	expect(selectors.map((selector) => selector.text)).toEqual(['a', 'b.c'])
	expect(as_selectors(selectors[0]!)).toEqual([selectors[0]])

	expect(as_prelude('media', '(min-width: 1px)').length).toBeGreaterThan(0)
})

test('as_selectors rejects nodes that are not selectors', () => {
	expect(() => as_selectors(as_value('1px'))).toThrow(TypeError)
})

test('declaration facts are normalized', () => {
	expect(
		get_declaration_facts(first('a { -WEBKIT-Transition: all 1s !important }', 'declaration')),
	).toEqual({
		property: 'transition',
		is_important: true,
		is_browserhack: false,
		is_vendor_prefixed: true,
	})
})

test('rule parts count selectors and declarations', () => {
	const parts = get_rule_parts(first('a, b { color: red; margin: 0 }', 'rule'))
	expect(parts.selectors).toHaveLength(2)
	expect(parts.declarations).toBe(2)
	expect(parts.is_empty).toBe(false)
	expect(get_rule_parts(first('a {}', 'rule')).is_empty).toBe(true)
})

test('selector parts list attributes, types and pseudos', () => {
	const [selector] = as_selectors('my-el[a]:hover::before')
	expect(get_selector_parts(selector!)).toEqual([
		{ kind: 'type', name: 'my-el' },
		{ kind: 'attribute', name: 'a' },
		{ kind: 'pseudo_class', name: 'hover' },
		{ kind: 'pseudo_element', name: 'before' },
	])
})

test('at-rule names are normalized and descriptors are plain strings', () => {
	expect(get_atrule_name(first('@-WEBKIT-keyframes k {}', 'atrule'))).toBe('keyframes')
	expect(
		get_descriptors(first('@font-face { font-family: A; font-display: swap }', 'atrule')),
	).toEqual({
		'font-family': 'A',
		'font-display': 'swap',
	})
})

test('locations include the source only when there is one', () => {
	const node = first('\na { color: red }', 'rule')
	expect(get_location(node)).toEqual({ line: 2, column: 1, offset: 1, length: 16 })
	expect(get_location(node, 'a.css')).toEqual({
		line: 2,
		column: 1,
		offset: 1,
		length: 16,
		source: 'a.css',
	})
})

test('get_data_uri only returns data: URIs, without quotes', () => {
	expect(data_uris('url(data:image/gif;base64,AA) url("data:text/plain,hi") url(a.png)')).toEqual([
		'data:image/gif;base64,AA',
		'data:text/plain,hi',
		undefined,
	])
})

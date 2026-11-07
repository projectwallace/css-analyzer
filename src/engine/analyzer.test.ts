import { test, expect, expectTypeOf } from 'vitest'
import { analyze, create_analyzer } from './analyzer.js'
import { define_collector } from './define-collector.js'
import { create_counter } from './counter.js'
import { parse } from '@projectwallace/css-parser'
import type { CollectorInstance, CountOptions, CountResult } from './types.js'

// Toy collectors: they exercise the contract the same way built-ins will
function declared_properties(options: CountOptions = {}) {
	return define_collector<CountResult>(function init() {
		const counter = create_counter(options)
		return {
			declaration(_node, ctx) {
				counter.add(ctx.property, ctx)
			},
			result: () => counter.result(),
		}
	})
}

function hash_colors() {
	return define_collector<CountResult>(function init() {
		const counter = create_counter()
		return {
			value: {
				types: ['hash'],
				enter(node, ctx) {
					counter.add(node.text, ctx.at(node))
				},
			},
			result: () => counter.result(),
		}
	})
}

function rule_count() {
	return define_collector<number>(function init() {
		let count = 0
		return {
			rule() {
				count++
			},
			result: () => count,
		}
	})
}

test('result type is inferred from the collectors that were passed', () => {
	const result = analyze('a { color: red }', { props: declared_properties(), rules: rule_count() })
	expectTypeOf(result.props).toEqualTypeOf<CountResult>()
	expectTypeOf(result.rules).toEqualTypeOf<number>()
	// @ts-expect-error not passed in
	void result.colors
	expect(result.rules).toBe(1)
	expect(result.props.unique.get('color')).toEqual({ count: 1 })
})

test('keys are chosen by the consumer', () => {
	const result = analyze('a { color: red }', { my_name: declared_properties() })
	expect(result.my_name.total).toBe(1)
})

test('normalizes the property and exposes declaration facts', () => {
	const seen: Record<string, unknown>[] = []
	const facts = define_collector<number>(() => ({
		declaration(_node, ctx) {
			seen.push({
				property: ctx.property,
				is_custom: ctx.is_custom,
				is_important: ctx.is_important,
				is_vendor_prefixed: ctx.is_vendor_prefixed,
				value_text: ctx.value_text,
			})
		},
		result: () => 0,
	}))
	analyze('a { -WEBKIT-Transition: all 1s; --x: 1 !important; COLOR: Red }', { facts })
	expect(seen).toEqual([
		{
			property: 'transition',
			is_custom: false,
			is_important: false,
			is_vendor_prefixed: true,
			value_text: 'all 1s',
		},
		{
			property: '--x',
			is_custom: true,
			is_important: true,
			is_vendor_prefixed: false,
			value_text: '1',
		},
		{
			property: 'color',
			is_custom: false,
			is_important: false,
			is_vendor_prefixed: false,
			value_text: 'Red',
		},
	])
})

test('declaration handlers can filter on properties before they run', () => {
	let calls = 0
	const filtered = define_collector<number>(() => ({
		declaration: {
			properties: new Set(['color']),
			enter() {
				calls++
			},
		},
		result: () => calls,
	}))
	const result = analyze('a { color: red; margin: 0; background: blue }', { filtered })
	expect(result.filtered).toBe(1)
})

test('one shared value walk feeds every value subscriber', () => {
	const result = analyze('a { color: #fff; background: linear-gradient(#000, #FFF) }', {
		colors: hash_colors(),
		other_colors: hash_colors(),
	})
	expect(result.colors.total).toBe(3)
	expect([...result.colors.unique.keys()]).toEqual(['#fff', '#000', '#FFF'])
	expect(result.other_colors.total).toBe(3)
})

test('structural context: depth, atrule_stack, parent_rule, in_keyframes', () => {
	const seen: [string, number, string[], boolean, string | undefined][] = []
	const structure = define_collector<number>(() => ({
		declaration(_node, ctx) {
			seen.push([
				ctx.property,
				ctx.depth,
				[...ctx.atrule_stack],
				ctx.in_keyframes,
				ctx.parent_rule?.text.slice(0, 1),
			])
		},
		result: () => 0,
	}))
	analyze(
		`a { color: red; b { margin: 0 } }
		@media (x) { c { padding: 0 } }
		@-webkit-keyframes k { from { top: 0 } }
		d { left: 0 }`,
		{ structure },
	)
	expect(seen).toEqual([
		['color', 1, [], false, 'a'],
		['margin', 2, [], false, 'b'],
		['padding', 2, ['media'], false, 'c'],
		['top', 2, ['keyframes'], true, 'f'],
		['left', 1, [], false, 'd'],
	])
})

test('unsubscribed node kinds are never dispatched', () => {
	const calls: string[] = []
	const only_rules = define_collector<number>(() => ({
		rule() {
			calls.push('rule')
		},
		result: () => 0,
	}))
	analyze('a { color: red } @media (x) { b { color: blue } }', { only_rules })
	expect(calls).toEqual(['rule', 'rule'])
})

test('parse options follow the subscriptions', () => {
	expect(create_analyzer({ rules: rule_count() }).parse_options).toEqual({
		selectors: false,
		values: false,
		atrule_preludes: false,
	})
	expect(create_analyzer({ colors: hash_colors() }).parse_options).toEqual({
		selectors: false,
		values: true,
		atrule_preludes: false,
	})

	const selectors = define_collector<number>(() => ({ selector() {}, result: () => 0 }))
	expect(create_analyzer({ selectors }).parse_options.selectors).toBe(true)

	const preludes = define_collector<number>(() => ({
		parse: { atrule_preludes: true },
		result: () => 0,
	}))
	expect(create_analyzer({ preludes }).parse_options.atrule_preludes).toBe(true)
})

test('values stay unparsed when nobody needs them', () => {
	let value: unknown = 'untouched'
	const raw = define_collector<number>(() => ({
		declaration(_node, ctx) {
			value = ctx.value
		},
		result: () => 0,
	}))
	analyze('a { color: red }', { raw })
	expect(value).toBeUndefined()
})

test('locations are opt-in per collector and carry the source', () => {
	const analyzer = create_analyzer({
		with: declared_properties({ locations: true }),
		without: declared_properties(),
	})
	analyzer.add('a { color: red }', { source: 'a.css' })
	const result = analyzer.result()

	expect(result.with.unique.get('color')?.locations).toEqual([
		{ line: 1, column: 5, offset: 4, length: 10, source: 'a.css' },
	])
	expect(result.without.unique.get('color')).toEqual({ count: 1 })
})

test('locations have no `source` when none is given', () => {
	const { props } = analyze('a { color: red }', { props: declared_properties({ locations: true }) })
	expect(props.unique.get('color')?.locations?.[0]?.source).toBeUndefined()
})

test('add() aggregates multiple inputs', () => {
	const analyzer = create_analyzer({ props: declared_properties({ locations: true }) })
	analyzer.add('a { color: red }', { source: 'a.css' })
	analyzer.add('b { color: blue; margin: 0 }', { source: 'b.css' })
	const { props } = analyzer.result()

	expect(props.total).toBe(3)
	expect(props.unique.get('color')?.locations?.map((loc) => loc.source)).toEqual(['a.css', 'b.css'])
})

test('add(a).add(b) equals analyzing both', () => {
	const a = 'a { color: red }'
	const b = 'b { color: blue; margin: 0 }'
	const incremental = create_analyzer({ props: declared_properties() }).add(a).add(b).result()
	const together = analyze(`${a}\n${b}`, { props: declared_properties() })
	expect(incremental).toEqual(together)
})

test('result() can be taken at any time and stays stable', () => {
	const analyzer = create_analyzer({ props: declared_properties() })
	analyzer.add('a { color: red }')
	const first = analyzer.result()
	analyzer.add('b { color: red }')
	expect(first.props.total).toBe(1)
	expect(analyzer.result().props.total).toBe(2)
})

test('accepts an already parsed AST', () => {
	const collectors = { colors: hash_colors(), rules: rule_count() }
	const { selectors, values, atrule_preludes } = create_analyzer(collectors).parse_options
	const ast = parse('a { color: #fff }', {
		parse_selectors: selectors,
		parse_values: values,
		parse_atrule_preludes: atrule_preludes,
	})
	const result = analyze(ast, collectors)
	expect(result.colors.total).toBe(1)
	expect(result.rules).toBe(1)
})

test('definitions are reusable and never share state between analyzers', () => {
	const collectors = { props: declared_properties() }
	const first = analyze('a { color: red }', collectors)
	const second = analyze('a { margin: 0 }', collectors)
	expect(first.props.total).toBe(1)
	expect(second.props.total).toBe(1)
	expect(second.props.unique.has('color')).toBe(false)
})

test('comment and stylesheet subscriptions', () => {
	const comments: unknown[] = []
	let css = ''
	const meta = define_collector<number>(() => ({
		comment(loc) {
			comments.push(loc)
		},
		stylesheet(_node, ctx) {
			css = ctx.css
		},
		result: () => comments.length,
	}))
	const input = '/* hi */ a { color: red }'
	const result = analyze(input, { meta }, { source: 'x.css' })
	expect(result.meta).toBe(1)
	expect(comments).toEqual([{ line: 1, column: 1, offset: 0, length: 8, source: 'x.css' }])
	expect(css).toBe(input)
})

test('CollectorInstance can be typed standalone', () => {
	const instance: CollectorInstance<number> = { result: () => 1 }
	expect(instance.result()).toBe(1)
})

test('value handlers learn the kind of node they got', () => {
	const kinds: string[] = []
	const kinds_collector = define_collector<number>(() => ({
		value: {
			types: ['hash', 'function', 'dimension', 'identifier'],
			enter(_node, _ctx, kind) {
				kinds.push(kind)
			},
		},
		result: () => 0,
	}))
	analyze('a { margin: 1px solid; color: #fff; background: url(a.png), linear-gradient(red) }', {
		kinds_collector,
	})
	expect(kinds).toEqual(['dimension', 'identifier', 'hash', 'function', 'identifier'])
})

test('clean_value_text drops IE hacks and is undefined for global keywords', () => {
	const seen: (string | undefined)[] = []
	const clean = define_collector<number>(() => ({
		parse: { values: true },
		declaration(_node, ctx) {
			seen.push(ctx.clean_value_text)
		},
		result: () => 0,
	}))
	analyze('a { width: 1px\\9; --x: 1px\\9; color: inherit; margin: 0 }', { clean })
	expect(seen).toEqual(['1px', '1px\\9', undefined, '0'])
})

test('font_shorthand is split once and is null for everything else', () => {
	const seen: unknown[] = []
	const shorthand = define_collector<number>(() => ({
		parse: { values: true },
		declaration(_node, ctx) {
			seen.push(ctx.font_shorthand, ctx.font_shorthand)
		},
		result: () => 0,
	}))
	analyze('a { font: 12px/1.5 Arial; color: red; font: caption }', { shorthand })
	expect(seen[0]).toBe(seen[1])
	expect(seen[0]).toEqual({
		font_size: '12px',
		line_height: '1.5',
		font_family: 'Arial',
		keywords: [],
	})
	expect(seen[2]).toBeNull()
	expect(seen[4]).toBeNull()
})

import { test, expect, expectTypeOf } from 'vitest'
import { analyze } from '../engine/analyzer.ts'
import { to_json } from '../engine/to-json.ts'
import type { Location } from '../engine/types.ts'
import { colors, properties, rules } from '../collectors/index.ts'

test('serializes a real result, with by_context, formats, locations and sequence', () => {
	const css = 'a { color: red; margin: 0 } b { color: #fff }'
	const result = analyze(css, {
		colors: colors({ contexts: true, locations: true }),
		rules: rules({ sequence: true }),
		properties: properties(),
	})
	const json = JSON.parse(JSON.stringify(to_json(result)))

	expect(json.colors.unique.red.count).toBe(1)
	expect(json.colors.unique.red.locations).toEqual([{ line: 1, column: 12, offset: 11, length: 3 }])
	expect(json.colors.by_context.color.unique['#fff']).toEqual({
		count: 1,
		locations: [expect.any(Object)],
	})
	expect(json.colors.formats.unique.named.count).toBe(1)
	expect(json.rules.sizes.sequence).toEqual([3, 2])
	expect(json.properties.unique.color.count).toBe(2)
})

test('does not change the input', () => {
	const { c } = analyze('a { color: red }', { c: colors() })
	to_json(c)
	expect(c.unique).toBeInstanceOf(Map)
})

test('the type has no Maps', () => {
	const { c } = analyze('a { color: red }', { c: colors({ contexts: true }) })
	const json = to_json(c)
	expectTypeOf(json.unique).toEqualTypeOf<{
		[key: string]: { count: number; locations?: Location[] }
	}>()
	expectTypeOf(json.total).toBeNumber()
})

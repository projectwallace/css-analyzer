import { test, expect } from 'vitest'
import { to_json } from './to-json.ts'

test('turns Maps into plain objects at any depth', () => {
	const map = new Map([['a', new Map([['b', { count: 1 }]])]])
	expect(to_json({ map })).toEqual({ map: { a: { b: { count: 1 } } } })
})

test('keeps primitives, null and arrays (copied)', () => {
	const input = { a: 1, b: 'x', c: null, d: [1, new Map([['k', 1]])], e: undefined }
	const actual = to_json(input)
	expect(actual).toEqual({ a: 1, b: 'x', c: null, d: [1, { k: 1 }], e: undefined })
	expect(actual.d).not.toBe(input.d)
})

test('number keys become strings', () => {
	expect(to_json(new Map([[1, 'a']]))).toEqual({ '1': 'a' })
})

test('a key like __proto__ stays an own property', () => {
	const actual = to_json(new Map([['__proto__', 1]]))
	expect(Object.keys(actual)).toEqual(['__proto__'])
	expect(Object.getPrototypeOf(actual)).toBe(Object.prototype)
})

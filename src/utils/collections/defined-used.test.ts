import { test, expect, describe } from 'vitest'
import { DefinedUsed } from './defined-used.ts'

describe('DefinedUsed class', () => {
	test('starts empty', () => {
		const tracker = new DefinedUsed()
		expect(tracker.analyze()).toEqual({
			defined: [],
			used: [],
			unused: [],
			unknown: [],
		})
	})

	test('tracks defined names', () => {
		const tracker = new DefinedUsed()
		tracker.define('--foo')
		tracker.define('--bar')
		const result = tracker.analyze()
		expect(result.defined).toEqual(['--foo', '--bar'])
		expect(result.used).toEqual([])
		expect(result.unused).toEqual(['--foo', '--bar'])
		expect(result.unknown).toEqual([])
	})

	test('tracks used names', () => {
		const tracker = new DefinedUsed()
		tracker.use('--foo')
		tracker.use('--bar')
		const result = tracker.analyze()
		expect(result.defined).toEqual([])
		expect(result.used).toEqual(['--foo', '--bar'])
		expect(result.unused).toEqual([])
		expect(result.unknown).toEqual(['--foo', '--bar'])
	})

	test('computes unused as defined but not used', () => {
		const tracker = new DefinedUsed()
		tracker.define('--foo')
		tracker.define('--bar')
		tracker.use('--foo')
		const result = tracker.analyze()
		expect(result.unused).toEqual(['--bar'])
		expect(result.unknown).toEqual([])
	})

	test('computes unknown as used but not defined', () => {
		const tracker = new DefinedUsed()
		tracker.define('--foo')
		tracker.use('--foo')
		tracker.use('--baz')
		const result = tracker.analyze()
		expect(result.unused).toEqual([])
		expect(result.unknown).toEqual(['--baz'])
	})

	test('deduplicates identical names', () => {
		const tracker = new DefinedUsed()
		tracker.define('--foo')
		tracker.define('--foo')
		tracker.use('--bar')
		tracker.use('--bar')
		const result = tracker.analyze()
		expect(result.defined).toEqual(['--foo'])
		expect(result.used).toEqual(['--bar'])
	})

	test('handles a name that is both defined and used', () => {
		const tracker = new DefinedUsed()
		tracker.define('--foo')
		tracker.use('--foo')
		const result = tracker.analyze()
		expect(result.defined).toEqual(['--foo'])
		expect(result.used).toEqual(['--foo'])
		expect(result.unused).toEqual([])
		expect(result.unknown).toEqual([])
	})
})

describe('payloads', () => {
	test('come back per name, for every definition and use', () => {
		const tracker = new DefinedUsed<{ line: number }>()
		tracker.define('a', { line: 1 })
		tracker.define('a', { line: 5 })
		tracker.use('a', { line: 9 })
		tracker.use('b', { line: 12 })
		tracker.define('c', { line: 20 })
		expect(tracker.payloads()).toEqual({
			definitions: new Map([
				['a', [{ line: 1 }, { line: 5 }]],
				['c', [{ line: 20 }]],
			]),
			usages: new Map([
				['a', [{ line: 9 }]],
				['b', [{ line: 12 }]],
			]),
		})
	})

	test('find the place of an unused and an unknown name', () => {
		const tracker = new DefinedUsed<string>()
		tracker.define('a', 'defined here')
		tracker.use('b', 'used here')
		const { unused, unknown } = tracker.analyze()
		const { definitions, usages } = tracker.payloads()
		expect(unused.map((name) => definitions.get(name))).toEqual([['defined here']])
		expect(unknown.map((name) => usages.get(name))).toEqual([['used here']])
	})

	test('are not kept for names without a payload, and analyze() does not change', () => {
		const tracker = new DefinedUsed<string>()
		tracker.define('a')
		tracker.use('a')
		expect(tracker.payloads()).toEqual({ definitions: new Map(), usages: new Map() })
		expect(tracker.analyze()).toEqual({ defined: ['a'], used: ['a'], unused: [], unknown: [] })
	})

	test('are copies: later changes do not show up in an earlier result', () => {
		const tracker = new DefinedUsed<number>()
		tracker.define('a', 1)
		const before = tracker.payloads()
		tracker.define('a', 2)
		expect(before.definitions.get('a')).toEqual([1])
	})
})

describe('Public API exports', () => {
	test('exports DefinedUsed class', () => {
		expect(typeof DefinedUsed).toBe('function')
		expect(new DefinedUsed().constructor.name).toBe('DefinedUsed')
	})
})

describe('unused_definitions', () => {
	test('lists unused names with the payload of their first definition', () => {
		const tracker = new DefinedUsed<string>()
		tracker.define('a', 'first a')
		tracker.define('a', 'second a')
		tracker.define('b', 'b')
		tracker.define('c')
		tracker.use('b')
		tracker.use('unknown')
		expect(tracker.unused_definitions()).toEqual([
			['a', 'first a'],
			['c', undefined],
		])
		expect(tracker.defined_size).toBe(3)
	})
})

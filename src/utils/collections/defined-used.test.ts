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

describe('Public API exports', () => {
	test('exports DefinedUsed class', () => {
		expect(typeof DefinedUsed).toBe('function')
		expect(new DefinedUsed().constructor.name).toBe('DefinedUsed')
	})
})

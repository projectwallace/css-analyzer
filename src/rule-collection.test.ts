import { test, expect, describe } from "vitest"
import { RuleCollection } from "./rule-collection"

describe("RuleCollection", () => {
	test("should initialize with empty items and locations", () => {
		const collection = new RuleCollection()
		expect(collection.total).toBe(0)
		expect([...collection.depths()]).toEqual([])
		expect([...collection.declaration_counts()]).toEqual([])
		expect([...collection.selector_counts()]).toEqual([])
		expect(collection.sizes.total).toEqual(0)
	})

	test("should add items correctly", () => {
		const collection = new RuleCollection()
		collection.add(1, 1, 0, 10, 2, 3, 4)
		collection.add(2, 2, 11, 20, 3, 5, 6)

		expect(collection.total).toBe(2)
		expect([...collection.depths()]).toEqual([2, 3])
		expect([...collection.declaration_counts()]).toEqual([3, 5])
		expect([...collection.selector_counts()]).toEqual([4, 6])
		expect(collection.sizes.total).toBe(2)
	})

	describe('sizes', () => {
		test('empty collection', () => {
			const collection = new RuleCollection()
			const sizes = collection.sizes
			expect(sizes.total).toBe(0)
			expect(sizes.sum).toBe(0)
			expect(sizes.max).toBeUndefined()
			expect(sizes.min).toBeUndefined()
			expect(sizes.mode).toBeUndefined()
			expect(sizes.total_unique).toBe(0)
			expect(sizes.uniqueness_ratio).toBe(0)
			expect([...sizes.items]).toEqual([])
			expect([...sizes.unique()]).toEqual([])
		})

		test('should calculate sizes correctly', () => {
			const collection = new RuleCollection()
			collection.add(1, 1, 0, 10, 2, 3, 4)
			collection.add(2, 2, 11, 20, 3, 5, 6)
			collection.add(3, 3, 21, 30, 4, 4, 7)

			const sizes = collection.sizes
			expect(sizes.total).toBe(3)
			expect(sizes.sum).toBe(7 + 11 + 11)
			expect(sizes.max).toBe(11)
			expect(sizes.min).toBe(7)
			expect(sizes.mode).toBe(11)
			expect(sizes.total_unique).toBe(2)
			expect(sizes.uniqueness_ratio).toBe(2 / 3)
			expect([...sizes.items]).toEqual([7, 11, 11])
			expect([...sizes.unique()]).toEqual([
				{ value: 7, count: 1, locations: [{ line: 1, column: 1, start: 0, end: 10 }] },
				{
					value: 11, count: 2, locations: [
						{ line: 2, column: 2, start: 11, end: 20 },
						{ line: 3, column: 3, start: 21, end: 30 }
					]
				},
			])
		})
	})
})

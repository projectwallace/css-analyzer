import { test, expect, describe } from "vitest"
import { RuleCollection } from "./rule-collection"
import { analyze } from "./index-new.js"

describe("RuleCollection", () => {
	test("should initialize with empty items and locations", () => {
		const collection = new RuleCollection()
		expect(collection.total).toBe(0)
		expect(collection.sizes.total).toEqual(0)
	})

	test("should add items correctly", () => {
		const collection = new RuleCollection()
		collection.add(1, 1, 0, 10, 2, 3, 4)
		collection.add(2, 2, 11, 20, 3, 5, 6)

		expect(collection.total).toBe(2)
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

describe('analyze', () => {
	test('counts rules', () => {
		let result = analyze(`
				html {
					color: black;
				}
				test {}
			`).rules
		expect(result.total).toBe(2)
	})

	test('handles CSS without rules', () => {
		let result = analyze(`@media all {}`).rules
		expect.soft(result.total).toBe(0)
		expect.soft(result.sizes.total).toBe(0)
		expect.soft(result.sizes.min).toBeUndefined()
		expect.soft(result.sizes.max).toBeUndefined()
	})

	describe('analyzes empty rules', () => {
		describe('no false positives', () => {
			test('rules', () => {
				let result = analyze(`test { color: red; }`).rules.empty
				expect.soft(result.total).toBe(0)
				expect.soft(result.ratio).toBe(0)
			})
			test('in atrule', () => {
				let fixture = `@media all { test { color: red; } }`
				let result = analyze(fixture).rules.empty
				expect.soft(result.total).toBe(0)
				expect.soft(result.ratio).toBe(0)
			})
		})

		test('one empty rule', () => {
			let result = analyze(`test {}`).rules.empty
			expect.soft(result.total).toBe(1)
			expect.soft(result.ratio).toBe(1)
		})

		test('empty rule in media query', () => {
			let fixture = `@media all { test {} }`
			let result = analyze(fixture).rules.empty
			expect.soft(result.total).toBe(1)
			expect.soft(result.ratio).toBe(1)
		})
	})

	test('analyzes rule sizes', () => {
		let result = analyze(`
			x {
				a: 1;
			}
			a,
			b {
				a: 1;
				b: 2;
			}
			c,
			d,
			e {
				a: 1;
				b: 2;
				c: 3;
			}

			@media print {
				@supports (display: grid) {
					f {
						a: 1;
						b: 2;
					}
				}
			}
		`).rules.sizes
		expect.soft(result.total).toBe(4)
		expect.soft(result.total_unique).toBe(4)
		expect.soft(result.max).toBe(6)
		expect.soft(result.min).toBe(2)
		expect.soft(result.mode).toBe(2)
		expect.soft(result.sum).toBe(15)
		expect.soft(result.average).toBe(15 / 4)
		expect.soft([...result.items]).toEqual([2, 4, 6, 3])
		expect.soft([...result.unique()].map(({ value, count }) => ({ value, count }))).toEqual([
			{ value: 2, count: 1 },
			{ value: 4, count: 1 },
			{ value: 6, count: 1 },
			{ value: 3, count: 1 },
		])
	})

	test('analyzes rule sizes', () => {
		let result = analyze(`
			x {
				a: 1;
			}
			a,
			b {
				a: 1;
				b: 2;
			}
			c,
			d,
			e {
				a: 1;
				b: 2;
				c: 3;
			}

			@media print {
				@supports (display: grid) {
					f {
						a: 1;
						b: 2;
					}
				}
			}
		`).rules.sizes
		expect.soft(result.total).toBe(4)
		expect.soft(result.total_unique).toBe(4)
		expect.soft(result.max).toBe(6)
		expect.soft(result.min).toBe(2)
		expect.soft(result.mode).toBe(2)
		expect.soft(result.sum).toBe(15)
		expect.soft(result.average).toBe(15 / 4)
		expect.soft([...result.items]).toEqual([2, 4, 6, 3])
		expect.soft([...result.unique()].map(({ value, count }) => ({ value, count }))).toEqual([
			{ value: 2, count: 1 },
			{ value: 4, count: 1 },
			{ value: 6, count: 1 },
			{ value: 3, count: 1 },
		])
	})

	test('analyzes rule sizes', () => {
		let result = analyze(`
			x {
				a: 1;
			}
			a,
			b {
				a: 1;
				b: 2;
			}
			c,
			d,
			e {
				a: 1;
				b: 2;
				c: 3;
			}

			@media print {
				@supports (display: grid) {
					f {
						a: 1;
						b: 2;
					}
				}
			}
		`).rules.sizes
		expect.soft(result.total).toBe(4)
		expect.soft(result.total_unique).toBe(4)
		expect.soft(result.max).toBe(6)
		expect.soft(result.min).toBe(2)
		expect.soft(result.mode).toBe(2)
		expect.soft(result.sum).toBe(15)
		expect.soft(result.average).toBe(15 / 4)
		expect.soft([...result.items]).toEqual([2, 4, 6, 3])
		expect.soft([...result.unique()].map(({ value, count }) => ({ value, count }))).toEqual([
			{ value: 2, count: 1 },
			{ value: 4, count: 1 },
			{ value: 6, count: 1 },
			{ value: 3, count: 1 },
		])
	})

	test('analyzes selector counts', () => {
		let result = analyze(`
			x {
				a: 1;
			}
			a,
			b {
				a: 1;
				b: 2;
			}
			c,
			d,
			e {
				a: 1;
				b: 2;
				c: 3;
			}

			@media print {
				@supports (display: grid) {
					f {
						a: 1;
						b: 2;
					}
				}
			}
		`).rules.selector_counts
		expect.soft(result.total).toBe(4)
		expect.soft(result.total_unique).toBe(3)
		expect.soft(result.max).toBe(3)
		expect.soft(result.min).toBe(1)
		expect.soft(result.mode).toBe(1)
		expect.soft(result.sum).toBe(7)
		expect.soft(result.average).toBe(7 / 4)
		expect.soft([...result.items]).toEqual([1, 2, 3, 1])
		expect.soft([...result.unique()].map(({ value, count }) => ({ value, count }))).toEqual([
			{ value: 1, count: 2 },
			{ value: 2, count: 1 },
			{ value: 3, count: 1 },
		])
	})

	test('analyzes declarations counts', () => {
		let result = analyze(`
			x {
				a: 1;
			}
			a,
			b {
				a: 1;
				b: 2;
			}
			c,
			d,
			e {
				a: 1;
				b: 2;
				c: 3;
			}

			@media print {
				@supports (display: grid) {
					f {
						a: 1;
						b: 2;
					}
				}
			}
		`).rules.declaration_counts
		expect.soft(result.total).toBe(4)
		expect.soft(result.total_unique).toBe(3)
		expect.soft(result.max).toBe(3)
		expect.soft(result.min).toBe(1)
		expect.soft(result.mode).toBe(2)
		expect.soft(result.sum).toBe(8)
		expect.soft(result.average).toBe(8 / 4)
		expect.soft([...result.items]).toEqual([1, 2, 3, 2])
		expect.soft([...result.unique()].map(({ value, count }) => ({ value, count }))).toEqual([
			{ value: 1, count: 1 },
			{ value: 2, count: 2 },
			{ value: 3, count: 1 },
		])
	})

	test('analyzes nesting', () => {
		let fixture = `
			a {
				color: red;
			}

			b {
				color: green;

				&:hover {
					color: blue;
				}

				color: deepskyblue;

				@container (width > 400px) {
					color: rebeccapurple;
				}
			}

			@media print {
				@supports (display: grid) {
					c {
						color: orange;
					}
				}
			}
		`
		let result = analyze(fixture).rules

		expect.soft(result.nesting.total).toBe(4)
		expect.soft(result.nesting.mode).toBe(0)
		expect.soft(result.nesting.total_unique).toBe(3)
		expect.soft(result.nesting.uniqueness_ratio).toBe(3 / 4)
		expect.soft(result.nesting.sum).toBe(3)
		expect.soft(result.nesting.max).toBe(2)
		expect.soft(result.nesting.min).toBe(0)
		expect.soft(result.nesting.average).toBe(3 / 4)
		expect.soft([...result.nesting.items]).toEqual([0, 0, 1, 2])
		expect.soft([...result.nesting.unique()].map(({ value, count }) => ({ value, count }))).toEqual([
			{ value: 0, count: 2 },
			{ value: 1, count: 1 },
			{ value: 2, count: 1 },
		])
	})
})
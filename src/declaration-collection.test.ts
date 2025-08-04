import { test, expect } from 'vitest'
import { DeclarationCollection } from './declaration-collection'
import { analyze } from './index-new.js'

test('empty DeclarationCollection', () => {
	const collection = new DeclarationCollection()
	expect(collection.total).toBe(0)
	expect(collection.total_unique).toBe(0)
	expect(collection.uniqueness_ratio).toBe(0)
})

test('handles empty values', () => {
	let css = `
		thing {
			height:;
			width: ;
		}
	`

	expect(() => analyze(css).declarations).not.toThrow()
})

test('JSON serialization', () => {
	const fixture = `
		rule {
			color: green;
			font-size: 16px;
		}
	`
	const actual = analyze(fixture).declarations
	const json = JSON.parse(JSON.stringify(actual))
	expect(json.total).toBe(2)
	expect(json.total_unique).toBe(2)
	expect(json.uniqueness_ratio).toBe(1)
	expect(json.items.length).toBe(2)
})

test('should be counted', () => {
	const fixture = `
		rule {
			color: green;
			color: orange !important;
		}

		rule2 {
			color: green; /* not unique */
		}

		@media print {
			@media (min-width: 1000px) {
				@supports (display: grid) {
					@keyframes test {
						from {
							opacity: 1;
						}
						to {
							opacity: 0;
						}
					}

					another-rule {
						color: purple;
					}
				}
			}
		}
	`
	const actual = analyze(fixture).declarations

	expect(actual.total).toBe(6)
	expect(actual.total_unique).toBe(5)
	expect(actual.uniqueness_ratio).toBe(5 / 6)
})

test('should count !importants', () => {
	const fixture = `
		some {
			color: red;
			color: red: !important;
		}

		@media (min-width: 0) {
			nested {
				color: darkred;
				color: darkred !important;
			}
		}

		@supports (color: rebeccapurple) {
			nested-too {
				color: rebeccapurple;
				color: rebeccapurple !important;
			}
		}

		@media print {
			@media (max-width: 0) {
				@page {
					color: black;
					color: black !important;
				}
			}
		}
	`
	const { total, importants, items } = analyze(fixture).declarations

	expect(total).toBe(8)

	expect(importants.total).toBe(4)
	expect(importants.ratio).toBe(0.5)
	expect(importants.in_keyframes.total).toBe(0)
	expect(importants.in_keyframes.ratio).toBe(0)
	expect(items.map(({ is_important }) => is_important)).toEqual(
		[false, true, false, true, false, true, false, true]
	)
})

/**
 * @see https://drafts.csswg.org/css-animations-1/#keyframes
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/@keyframes#!important_in_a_keyframe
 */
test('should calculate !importants within @keyframes', () => {
	const fixture = `
		test1 {
			color: green !important;
		}

		@keyframes myTest {
			from {
				opacity: 1 !important;
			}
		}
	`
	const result = analyze(fixture)
	const { total, importants } = result.declarations

	expect(total).toBe(2)
	expect(importants.total).toBe(2)
	expect(importants.ratio).toBe(2 / 2)
	expect(importants.in_keyframes.total).toBe(1)
	expect(importants.in_keyframes.ratio).toBe(1 / 2)
})

test('should count complexity', () => {
	const css = `
		a {
			color: green;
			color: green !important;
		}

		@keyframes test {
			from {
				opacity: 1 !important;
			}
		}
	`
	const { total, complexity, items } = analyze(css).declarations
	expect(total).toBe(3)
	expect(complexity.sum).toBe(5)
	expect(complexity.min).toEqual(1)
	expect(complexity.max).toEqual(2)
	expect(complexity.average).toBe(5 / 3)
	expect(complexity.mode).toBe(2)
	expect(items.map(({ complexity }) => complexity)).toEqual([1, 2, 2])
	expect(Array.from(complexity.unique()).map(({ value, count }) => ({ value, count }))).toEqual([
		{ value: 1, count: 1 },
		{ value: 2, count: 2 }
	])
})

test('tracks nesting depth', () => {
	const fixture = `
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
				color: rebeccapurple
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
	const { total, nesting, items } = analyze(fixture).declarations
	expect(total).toBe(6)
	expect(nesting.min).toEqual(0)
	expect(nesting.max).toEqual(2)
	expect(nesting.sum).toBe(4)
	expect(nesting.average).toBe(4 / 6)
	expect(nesting.mode).toBe(0)
	expect(nesting.total_unique).toBe(3)
	expect(nesting.uniqueness_ratio).toBe(3 / 6)
	expect(items.map(({ depth }) => depth)).toEqual([0, 0, 1, 0, 1, 2])
	const unique = Array.from(nesting.unique()).map(({ value, count }) => ({ value, count }))
	expect(unique).toEqual([
		{ value: 0, count: 3 },
		{ value: 1, count: 2 },
		{ value: 2, count: 1 }
	])
})

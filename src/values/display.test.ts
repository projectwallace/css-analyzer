import { describe, test, expect } from 'vitest'
import { analyze } from '../index'

test('counts', () => {
	// Test data from https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/display#syntax
	const fixture = `
		test {
			/* short display */
			display: none;
			display: contents;
			display: block;
			display: flow-root;
			display: inline;
			display: inline-block;
			display: list-item;
			display: flex;
			display: inline-flex;
			display: grid;
			display: inline-grid;
			display: table;
			display: inline-table;
		}
	`
	const actual = analyze(fixture).values.displays
	expect(actual.total).toBe(13)
	expect(actual.totalUnique).toBe(actual.total)
	expect(actual.uniquenessRatio).toBe(1)
	expect(actual.unique).toEqual({
		none: 1,
		contents: 1,
		block: 1,
		'flow-root': 1,
		inline: 1,
		'inline-block': 1,
		'list-item': 1,
		flex: 1,
		'inline-flex': 1,
		grid: 1,
		'inline-grid': 1,
		table: 1,
		'inline-table': 1,
	})
})

test('handles two-value', () => {
	// Test data from https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/display#syntax
	const fixture = `
		test {
			/* full display */
			display: block flow;
			display: block flow-root;
			display: inline flow;
			display: inline flow-root;
			display: block flow list-item;
			display: inline flow list-item;
			display: block flex;
			display: inline flex;
			display: block grid;
			display: inline grid;
			display: block table;
			display: inline table;
		}
	`
	const actual = analyze(fixture).values.displays
	expect(actual.total).toBe(12)
	expect(actual.totalUnique).toBe(actual.total)
	expect(actual.uniquenessRatio).toBe(1)
	expect(actual.unique).toEqual({
		'block flow': 1,
		'block flow-root': 1,
		'inline flow': 1,
		'inline flow-root': 1,
		'block flow list-item': 1,
		'inline flow list-item': 1,
		'block flex': 1,
		'inline flex': 1,
		'block grid': 1,
		'inline grid': 1,
		'block table': 1,
		'inline table': 1,
	})
})

test('normalizes casing', () => {
	const fixture = `
		test {
			DISPLAY: BLOCK;
			display: Block;
		}
	`
	const actual = analyze(fixture).values.displays
	expect(actual.unique).toEqual({
		block: 2,
	})
})

test('handles value prefixes', () => {
	const fixture = `
		test {
			display: -webkit-box;
			display: -Webkit-box;
			display: -ms-flexbox;
			display: -MS-flexbox;
		}
	`
	const actual = analyze(fixture).values.displays
	expect(actual.unique).toEqual({
		'-webkit-box': 2,
		'-ms-flexbox': 2,
	})
})

test('handles property prefixes', () => {
	const fixture = `
		test {
			-webkit-display: block;
			-O-display: inline;
		}
	`
	const actual = analyze(fixture).values.displays
	expect(actual.unique).toEqual({
		block: 1,
		inline: 1,
	})
})

test('handles property browserhacks', () => {
	const fixture = `
		test {
			*display: block;
			_display: inline;
		}
	`
	const actual = analyze(fixture).values.displays
	expect(actual.unique).toEqual({
		block: 1,
		inline: 1,
	})
})

test('handles value browserhacks', () => {
	const fixture = `
		test {
			display: inline\\9;
			display: Inline\\9;
			display: block!ie;
			display: block !test;
		}
	`
	const actual = analyze(fixture).values.displays
	expect(actual.unique).toEqual({
		inline: 2,
		block: 2,
	})
})

test('handles var()', () => {
	const fixture = `
		test {
			display: var(--myDisplay);
			display: var(--inline-dir) flow-root;
			display: Var(--inline-dir) flow-root;
		}
	`
	const actual = analyze(fixture).values.displays
	expect(actual.unique).toEqual({
		'var(--myDisplay)': 1,
		'var(--inline-dir) flow-root': 1,
		'Var(--inline-dir) flow-root': 1,
	})
})

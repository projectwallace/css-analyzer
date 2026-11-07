import { test, expect } from 'vitest'
import { analyze } from '../engine/analyzer.js'
import { plain } from '../test-utils.js'
import { resets } from './values.js'

function run(css: string) {
	return plain(analyze(css, { result: resets() }).result)
}

test('does not report false positives', () => {
	const actual = run(`t {
		margin: 0px 10px;
		margin: 10px 10px;
		margin: auto 10px;
		margin: 10px auto;
	}`)
	const resets = actual
	expect(resets.total).toBe(0)
	expect(resets.unique).toEqual({})
})

test('accepts zeroes with units', () => {
	const actual = run(`t {
		margin: 0px 0em 0pc 0vw;
		padding: 0px 0dvh 0rem 0in;
	}`)
	const resets = actual
	expect(resets.unique).toEqual({ margin: 1, padding: 1 })
})

test('crazy notations', () => {
	const actual = run(`t {
		margin: 0;
		margin: -0;
		margin: +0;
		margin: 0px;
		margin: -0px;
		margin: +0px;
		margin: 0.0;
		margin: -0.0;
		margin: +0.0;
		margin: 0.0e0;
		margin: -0.0e0;
		margin: +0.0e0;
	}`)
	const resets = actual
	expect(resets.unique).toEqual({ margin: 12 })
})

test('accepts weird casing', () => {
	const actual = run(`t {
		MARGIN: 0;
	}`)
	expect(actual.unique).toEqual({ margin: 1 })
})

test('accepts vendor prefixes', () => {
	const actual = run(`t {
		-webkit-margin: 0;
	}`)
	expect(actual.unique).toEqual({ margin: 1 })
})

test('accepts browserhacks', () => {
	const actual = run(`t {
		*margin: 0;
	}`)
	expect(actual.unique).toEqual({ margin: 1 })
})

test('does not report false positive for custom property', () => {
	const actual = run(`t {
		--my-margin: 0;
	}`)
	expect(actual.unique).toEqual({})
})

// Test all properties

test('margin: 0', () => {
	const actual = run(`t { margin: 0; }`)
	const resets = actual
	expect(resets.unique).toEqual({ margin: 1 })
})

test('margin-top: 0', () => {
	const actual = run(`t { margin-top: 0; }`)
	const resets = actual
	expect(resets.unique).toEqual({ 'margin-top': 1 })
})

test('margin-right: 0', () => {
	const actual = run(`t { margin-right: 0; }`)
	const resets = actual
	expect(resets.unique).toEqual({ 'margin-right': 1 })
})

test('margin-bottom: 0', () => {
	const actual = run(`t { margin-bottom: 0; }`)
	const resets = actual
	expect(resets.unique).toEqual({ 'margin-bottom': 1 })
})

test('margin-left: 0', () => {
	const actual = run(`t { margin-left: 0; }`)
	const resets = actual
	expect(resets.unique).toEqual({ 'margin-left': 1 })
})

test('margin-inline: 0', () => {
	const actual = run(`t { margin-inline: 0; }`)
	const resets = actual
	expect(resets.unique).toEqual({ 'margin-inline': 1 })
})

test('margin-block: 0', () => {
	const actual = run(`t { margin-block: 0; }`)
	const resets = actual
	expect(resets.unique).toEqual({ 'margin-block': 1 })
})

test('padding: 0', () => {
	const actual = run(`t { padding: 0; }`)
	const resets = actual
	expect(resets.unique).toEqual({ padding: 1 })
})

test('padding-top: 0', () => {
	const actual = run(`t { padding-top: 0; }`)
	const resets = actual
	expect(resets.unique).toEqual({ 'padding-top': 1 })
})

test('padding-right: 0', () => {
	const actual = run(`t { padding-right: 0; }`)
	const resets = actual
	expect(resets.unique).toEqual({ 'padding-right': 1 })
})

test('padding-bottom: 0', () => {
	const actual = run(`t { padding-bottom: 0; }`)
	const resets = actual
	expect(resets.unique).toEqual({ 'padding-bottom': 1 })
})

test('padding-left: 0', () => {
	const actual = run(`t { padding-left: 0; }`)
	const resets = actual
	expect(resets.unique).toEqual({ 'padding-left': 1 })
})

test('padding-inline: 0', () => {
	const actual = run(`t { padding-inline: 0; }`)
	const resets = actual
	expect(resets.unique).toEqual({ 'padding-inline': 1 })
})

test('padding-block: 0', () => {
	const actual = run(`t { padding-block: 0; }`)
	const resets = actual
	expect(resets.unique).toEqual({ 'padding-block': 1 })
})

// Shorthands

test('margin-inline: 0 0', () => {
	const actual = run(`t { margin-inline: 0 0; }`)
	const resets = actual
	expect(resets.unique).toEqual({ 'margin-inline': 1 })
})

test('padding-inline: 0 0', () => {
	const actual = run(`t { padding-inline: 0 0; }`)
	const resets = actual
	expect(resets.unique).toEqual({ 'padding-inline': 1 })
})

test('margin-block: 0 0', () => {
	const actual = run(`t { margin-block: 0 0; }`)
	const resets = actual
	expect(resets.unique).toEqual({ 'margin-block': 1 })
})

test('padding-block: 0 0', () => {
	const actual = run(`t { padding-block: 0 0; }`)
	const resets = actual
	expect(resets.unique).toEqual({ 'padding-block': 1 })
})

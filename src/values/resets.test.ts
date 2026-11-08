import { analyze } from '../index.ts'
import { test } from 'vitest'
import { expect } from 'vitest'

test('does not report false positives', () => {
	const actual = analyze(`t {
		margin: 0px 10px;
		margin: 10px 10px;
		margin: auto 10px;
		margin: 10px auto;
	}`)
	const resets = actual.values.resets
	expect(resets.total).toBe(0)
	expect(resets.unique).toEqual({})
})

test('accepts zeroes with units', () => {
	const actual = analyze(`t {
		margin: 0px 0em 0pc 0vw;
		padding: 0px 0dvh 0rem 0in;
	}`)
	const resets = actual.values.resets
	expect(resets.unique).toEqual({ margin: 1, padding: 1 })
})

test('crazy notations', () => {
	const actual = analyze(`t {
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
	const resets = actual.values.resets
	expect(resets.unique).toEqual({ margin: 12 })
})

test('accepts weird casing', () => {
	const actual = analyze(`t {
		MARGIN: 0;
	}`).values.resets
	expect(actual.unique).toEqual({ margin: 1 })
})

test('accepts vendor prefixes', () => {
	const actual = analyze(`t {
		-webkit-margin: 0;
	}`).values.resets
	expect(actual.unique).toEqual({ margin: 1 })
})

test('accepts browserhacks', () => {
	const actual = analyze(`t {
		*margin: 0;
	}`).values.resets
	expect(actual.unique).toEqual({ margin: 1 })
})

test('does not report false positive for custom property', () => {
	const actual = analyze(`t {
		--my-margin: 0;
	}`).values.resets
	expect(actual.unique).toEqual({})
})

// Test all properties

test('margin: 0', () => {
	const actual = analyze(`t { margin: 0; }`)
	const resets = actual.values.resets
	expect(resets.unique).toEqual({ margin: 1 })
})

test('margin-top: 0', () => {
	const actual = analyze(`t { margin-top: 0; }`)
	const resets = actual.values.resets
	expect(resets.unique).toEqual({ 'margin-top': 1 })
})

test('margin-right: 0', () => {
	const actual = analyze(`t { margin-right: 0; }`)
	const resets = actual.values.resets
	expect(resets.unique).toEqual({ 'margin-right': 1 })
})

test('margin-bottom: 0', () => {
	const actual = analyze(`t { margin-bottom: 0; }`)
	const resets = actual.values.resets
	expect(resets.unique).toEqual({ 'margin-bottom': 1 })
})

test('margin-left: 0', () => {
	const actual = analyze(`t { margin-left: 0; }`)
	const resets = actual.values.resets
	expect(resets.unique).toEqual({ 'margin-left': 1 })
})

test('margin-inline: 0', () => {
	const actual = analyze(`t { margin-inline: 0; }`)
	const resets = actual.values.resets
	expect(resets.unique).toEqual({ 'margin-inline': 1 })
})

test('margin-block: 0', () => {
	const actual = analyze(`t { margin-block: 0; }`)
	const resets = actual.values.resets
	expect(resets.unique).toEqual({ 'margin-block': 1 })
})

test('padding: 0', () => {
	const actual = analyze(`t { padding: 0; }`)
	const resets = actual.values.resets
	expect(resets.unique).toEqual({ padding: 1 })
})

test('padding-top: 0', () => {
	const actual = analyze(`t { padding-top: 0; }`)
	const resets = actual.values.resets
	expect(resets.unique).toEqual({ 'padding-top': 1 })
})

test('padding-right: 0', () => {
	const actual = analyze(`t { padding-right: 0; }`)
	const resets = actual.values.resets
	expect(resets.unique).toEqual({ 'padding-right': 1 })
})

test('padding-bottom: 0', () => {
	const actual = analyze(`t { padding-bottom: 0; }`)
	const resets = actual.values.resets
	expect(resets.unique).toEqual({ 'padding-bottom': 1 })
})

test('padding-left: 0', () => {
	const actual = analyze(`t { padding-left: 0; }`)
	const resets = actual.values.resets
	expect(resets.unique).toEqual({ 'padding-left': 1 })
})

test('padding-inline: 0', () => {
	const actual = analyze(`t { padding-inline: 0; }`)
	const resets = actual.values.resets
	expect(resets.unique).toEqual({ 'padding-inline': 1 })
})

test('padding-block: 0', () => {
	const actual = analyze(`t { padding-block: 0; }`)
	const resets = actual.values.resets
	expect(resets.unique).toEqual({ 'padding-block': 1 })
})

// Shorthands

test('margin-inline: 0 0', () => {
	const actual = analyze(`t { margin-inline: 0 0; }`)
	const resets = actual.values.resets
	expect(resets.unique).toEqual({ 'margin-inline': 1 })
})

test('padding-inline: 0 0', () => {
	const actual = analyze(`t { padding-inline: 0 0; }`)
	const resets = actual.values.resets
	expect(resets.unique).toEqual({ 'padding-inline': 1 })
})

test('margin-block: 0 0', () => {
	const actual = analyze(`t { margin-block: 0 0; }`)
	const resets = actual.values.resets
	expect(resets.unique).toEqual({ 'margin-block': 1 })
})

test('padding-block: 0 0', () => {
	const actual = analyze(`t { padding-block: 0 0; }`)
	const resets = actual.values.resets
	expect(resets.unique).toEqual({ 'padding-block': 1 })
})

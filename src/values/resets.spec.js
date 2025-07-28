import { analyze } from "../index.js"
import { suite } from 'uvu'
import * as assert from 'uvu/assert'

const test = suite("resets")

test('does not report false positives', () => {
	let actual = analyze(`t {
		margin: 0px 10px;
		margin: 10px 10px;
		margin: auto 10px;
		margin: 10px auto;
	}`)
	let resets = actual.values.resets
	assert.is(resets.total, 0)
	assert.equal(resets.unique, {})
})

test('accepts zeroes with units', () => {
	let actual = analyze(`t {
		margin: 0px 0em 0pc 0vw;
		padding: 0px 0dvh 0rem 0in;
	}`)
	let resets = actual.values.resets
	assert.equal(resets.unique, { 'margin': 1, 'padding': 1 })
})

test('crazy notations', () => {
	let actual = analyze(`t {
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
	let resets = actual.values.resets
	assert.equal(resets.unique, { 'margin': 12 })
})

test('accepts weird casing', () => {
	let actual = analyze(`t {
		MARGIN: 0;
	}`)
	let resets = actual.values.resets
	assert.equal(resets.unique, { 'MARGIN': 1 })
})

test('accepts vendor prefixes', () => {
	let actual = analyze(`t {
		-webkit-margin: 0;
	}`)
	let resets = actual.values.resets
	assert.equal(resets.unique, { '-webkit-margin': 1 })
})

// Test all properties

test('margin: 0', () => {
	let actual = analyze(`t { margin: 0; }`)
	let resets = actual.values.resets
	assert.equal(resets.unique, { 'margin': 1 })
})

test('margin-top: 0', () => {
	let actual = analyze(`t { margin-top: 0; }`)
	let resets = actual.values.resets
	assert.equal(resets.unique, { 'margin-top': 1 })
})

test('margin-right: 0', () => {
	let actual = analyze(`t { margin-right: 0; }`)
	let resets = actual.values.resets
	assert.equal(resets.unique, { 'margin-right': 1 })
})

test('margin-bottom: 0', () => {
	let actual = analyze(`t { margin-bottom: 0; }`)
	let resets = actual.values.resets
	assert.equal(resets.unique, { 'margin-bottom': 1 })
})

test('margin-left: 0', () => {
	let actual = analyze(`t { margin-left: 0; }`)
	let resets = actual.values.resets
	assert.equal(resets.unique, { 'margin-left': 1 })
})

test('margin-inline: 0', () => {
	let actual = analyze(`t { margin-inline: 0; }`)
	let resets = actual.values.resets
	assert.equal(resets.unique, { 'margin-inline': 1 })
})

test('margin-block: 0', () => {
	let actual = analyze(`t { margin-block: 0; }`)
	let resets = actual.values.resets
	assert.equal(resets.unique, { 'margin-block': 1 })
})

test('padding: 0', () => {
	let actual = analyze(`t { padding: 0; }`)
	let resets = actual.values.resets
	assert.equal(resets.unique, { 'padding': 1 })
})

test('padding-top: 0', () => {
	let actual = analyze(`t { padding-top: 0; }`)
	let resets = actual.values.resets
	assert.equal(resets.unique, { 'padding-top': 1 })
})

test('padding-right: 0', () => {
	let actual = analyze(`t { padding-right: 0; }`)
	let resets = actual.values.resets
	assert.equal(resets.unique, { 'padding-right': 1 })
})

test('padding-bottom: 0', () => {
	let actual = analyze(`t { padding-bottom: 0; }`)
	let resets = actual.values.resets
	assert.equal(resets.unique, { 'padding-bottom': 1 })
})

test('padding-left: 0', () => {
	let actual = analyze(`t { padding-left: 0; }`)
	let resets = actual.values.resets
	assert.equal(resets.unique, { 'padding-left': 1 })
})

test('padding-inline: 0', () => {
	let actual = analyze(`t { padding-inline: 0; }`)
	let resets = actual.values.resets
	assert.equal(resets.unique, { 'padding-inline': 1 })
})

test('padding-block: 0', () => {
	let actual = analyze(`t { padding-block: 0; }`)
	let resets = actual.values.resets
	assert.equal(resets.unique, { 'padding-block': 1 })
})

// Shorthands

test('margin-inline: 0 0', () => {
	let actual = analyze(`t { margin-inline: 0 0; }`)
	let resets = actual.values.resets
	assert.equal(resets.unique, { 'margin-inline': 1 })
})

test('padding-inline: 0 0', () => {
	let actual = analyze(`t { padding-inline: 0 0; }`)
	let resets = actual.values.resets
	assert.equal(resets.unique, { 'padding-inline': 1 })
})

test('margin-block: 0 0', () => {
	let actual = analyze(`t { margin-block: 0 0; }`)
	let resets = actual.values.resets
	assert.equal(resets.unique, { 'margin-block': 1 })
})

test('padding-block: 0 0', () => {
	let actual = analyze(`t { padding-block: 0 0; }`)
	let resets = actual.values.resets
	assert.equal(resets.unique, { 'padding-block': 1 })
})

test.run()

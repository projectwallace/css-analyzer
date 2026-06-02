import { test, expect, describe } from 'vitest'
import { DefinedUsed } from './defined-used.js'
import { analyze } from './index.js'

describe('DefinedUsed class', () => {
	test('starts empty', () => {
		let tracker = new DefinedUsed()
		expect(tracker.analyze()).toEqual({
			defined: [],
			used: [],
			unused: [],
			unknown: [],
		})
	})

	test('tracks defined names', () => {
		let tracker = new DefinedUsed()
		tracker.define('--foo')
		tracker.define('--bar')
		let result = tracker.analyze()
		expect(result.defined).toEqual(['--foo', '--bar'])
		expect(result.used).toEqual([])
		expect(result.unused).toEqual(['--foo', '--bar'])
		expect(result.unknown).toEqual([])
	})

	test('tracks used names', () => {
		let tracker = new DefinedUsed()
		tracker.use('--foo')
		tracker.use('--bar')
		let result = tracker.analyze()
		expect(result.defined).toEqual([])
		expect(result.used).toEqual(['--foo', '--bar'])
		expect(result.unused).toEqual([])
		expect(result.unknown).toEqual(['--foo', '--bar'])
	})

	test('computes unused as defined but not used', () => {
		let tracker = new DefinedUsed()
		tracker.define('--foo')
		tracker.define('--bar')
		tracker.use('--foo')
		let result = tracker.analyze()
		expect(result.unused).toEqual(['--bar'])
		expect(result.unknown).toEqual([])
	})

	test('computes unknown as used but not defined', () => {
		let tracker = new DefinedUsed()
		tracker.define('--foo')
		tracker.use('--foo')
		tracker.use('--baz')
		let result = tracker.analyze()
		expect(result.unused).toEqual([])
		expect(result.unknown).toEqual(['--baz'])
	})

	test('deduplicates identical names', () => {
		let tracker = new DefinedUsed()
		tracker.define('--foo')
		tracker.define('--foo')
		tracker.use('--bar')
		tracker.use('--bar')
		let result = tracker.analyze()
		expect(result.defined).toEqual(['--foo'])
		expect(result.used).toEqual(['--bar'])
	})

	test('handles a name that is both defined and used', () => {
		let tracker = new DefinedUsed()
		tracker.define('--foo')
		tracker.use('--foo')
		let result = tracker.analyze()
		expect(result.defined).toEqual(['--foo'])
		expect(result.used).toEqual(['--foo'])
		expect(result.unused).toEqual([])
		expect(result.unknown).toEqual([])
	})
})

describe('Custom properties', () => {
	test('tracks declared custom properties as defined', () => {
		let css = `:root { --color: red; --size: 16px; }`
		let result = analyze(css).properties.custom
		expect(result.defined).toEqual(['--color', '--size'])
	})

	test('tracks var() references as used', () => {
		let css = `.foo { color: var(--color); }`
		let result = analyze(css).properties.custom
		expect(result.used).toEqual(['--color'])
	})

	test('identifies unused custom properties', () => {
		let css = `:root { --color: red; --size: 16px; } .foo { color: var(--color); }`
		let result = analyze(css).properties.custom
		expect(result.defined).toContain('--color')
		expect(result.defined).toContain('--size')
		expect(result.unused).toEqual(['--size'])
		expect(result.unknown).toEqual([])
	})

	test('identifies unknown (undeclared) custom properties', () => {
		let css = `.foo { margin: var(--spacing); }`
		let result = analyze(css).properties.custom
		expect(result.defined).toEqual([])
		expect(result.unknown).toEqual(['--spacing'])
	})

	test('handles nested var() fallbacks', () => {
		let css = `.foo { color: var(--primary, var(--secondary, red)); }`
		let result = analyze(css).properties.custom
		expect(result.used).toContain('--primary')
		expect(result.used).toContain('--secondary')
	})

	test('tracks @property definitions', () => {
		let css = `@property --my-color { syntax: '<color>'; inherits: false; initial-value: red; }`
		let result = analyze(css).properties.custom
		expect(result.defined).toContain('--my-color')
	})

	test('handles all four states in a realistic example', () => {
		let css = `
			:root { --color: red; --size: 16px; }
			.foo { color: var(--color); margin: var(--spacing); }
		`
		let result = analyze(css).properties.custom
		expect(result.defined).toEqual(['--color', '--size'])
		expect(result.used).toEqual(['--color', '--spacing'])
		expect(result.unused).toEqual(['--size'])
		expect(result.unknown).toEqual(['--spacing'])
	})

	test('custom property self-reference counts as both defined and used', () => {
		let css = `:root { --foo: var(--foo); }`
		let result = analyze(css).properties.custom
		expect(result.defined).toEqual(['--foo'])
		expect(result.used).toEqual(['--foo'])
		expect(result.unused).toEqual([])
		expect(result.unknown).toEqual([])
	})
})

describe('Animation names / keyframes', () => {
	test('tracks @keyframes names as defined', () => {
		let css = `@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`
		let result = analyze(css).atrules.keyframes
		expect(result.defined).toEqual(['spin'])
	})

	test('tracks animation-name references as used', () => {
		let css = `.foo { animation-name: spin; }`
		let result = analyze(css).atrules.keyframes
		expect(result.used).toEqual(['spin'])
	})

	test('tracks animation shorthand names as used', () => {
		let css = `.foo { animation: 1s linear spin; }`
		let result = analyze(css).atrules.keyframes
		expect(result.used).toEqual(['spin'])
	})

	test('identifies unused keyframes', () => {
		let css = `
			@keyframes spin {}
			@keyframes fade {}
			.foo { animation-name: spin; }
		`
		let result = analyze(css).atrules.keyframes
		expect(result.defined).toEqual(['spin', 'fade'])
		expect(result.used).toEqual(['spin'])
		expect(result.unused).toEqual(['fade'])
		expect(result.unknown).toEqual([])
	})

	test('identifies unknown animation names', () => {
		let css = `.foo { animation-name: spin, bounce; }`
		let result = analyze(css).atrules.keyframes
		expect(result.unknown).toEqual(['spin', 'bounce'])
		expect(result.defined).toEqual([])
	})

	test('handles vendor-prefixed @keyframes as defined', () => {
		let css = `@-webkit-keyframes spin {}`
		let result = analyze(css).atrules.keyframes
		expect(result.defined).toEqual(['spin'])
	})
})

describe('Container names', () => {
	test('tracks container-name declarations as defined', () => {
		let css = `.parent { container-name: sidebar; }`
		let result = analyze(css).atrules.container.names
		expect(result.defined).toEqual(['sidebar'])
	})

	test('tracks container shorthand names as defined', () => {
		let css = `.parent { container: main / inline-size; }`
		let result = analyze(css).atrules.container.names
		expect(result.defined).toEqual(['main'])
	})

	test('tracks @container query names as used', () => {
		let css = `@container sidebar (min-width: 400px) { .child { width: 100%; } }`
		let result = analyze(css).atrules.container.names
		expect(result.used).toEqual(['sidebar'])
	})

	test('identifies unused container names', () => {
		let css = `
			.a { container-name: sidebar; }
			.b { container-name: main; }
			@container sidebar (min-width: 400px) { .child { width: 100%; } }
		`
		let result = analyze(css).atrules.container.names
		expect(result.defined).toEqual(['sidebar', 'main'])
		expect(result.used).toEqual(['sidebar'])
		expect(result.unused).toEqual(['main'])
		expect(result.unknown).toEqual([])
	})

	test('identifies unknown container names', () => {
		let css = `@container content (min-width: 200px) { .inner { font-size: 2rem; } }`
		let result = analyze(css).atrules.container.names
		expect(result.unknown).toEqual(['content'])
		expect(result.defined).toEqual([])
	})

	test('unnamed @container does not track a used name', () => {
		let css = `@container (min-width: 400px) { .child { width: 100%; } }`
		let result = analyze(css).atrules.container.names
		expect(result.used).toEqual([])
	})
})

describe('Layer names', () => {
	test('tracks @layer ordering statements as defined', () => {
		let css = `@layer reset, base, theme;`
		let result = analyze(css).atrules.layer
		expect(result.defined).toEqual(['reset', 'base', 'theme'])
	})

	test('tracks @layer block declarations as used', () => {
		let css = `@layer reset { * { box-sizing: border-box; } }`
		let result = analyze(css).atrules.layer
		expect(result.used).toEqual(['reset'])
	})

	test('tracks @import layer() as used', () => {
		let css = `@import url('base.css') layer(base);`
		let result = analyze(css).atrules.layer
		expect(result.used).toEqual(['base'])
	})

	test('identifies unused layers (ordered but never filled)', () => {
		let css = `
			@layer reset, base, theme;
			@layer reset { * { box-sizing: border-box; } }
			@layer base { body { margin: 0; } }
		`
		let result = analyze(css).atrules.layer
		expect(result.defined).toEqual(['reset', 'base', 'theme'])
		expect(result.used).toEqual(['reset', 'base'])
		expect(result.unused).toEqual(['theme'])
		expect(result.unknown).toEqual([])
	})

	test('identifies unknown layers (filled but never ordered)', () => {
		let css = `@layer theme { :root { --color: red; } }`
		let result = analyze(css).atrules.layer
		expect(result.used).toEqual(['theme'])
		expect(result.defined).toEqual([])
		expect(result.unknown).toEqual(['theme'])
	})

	test('anonymous layers are not tracked in DefinedUsed', () => {
		let css = `@layer { .foo { color: red; } }`
		let result = analyze(css).atrules.layer
		expect(result.defined).toEqual([])
		expect(result.used).toEqual([])
	})
})

describe('Anchor names', () => {
	test('tracks anchor-name declarations as defined', () => {
		let css = `.anchor { anchor-name: --my-anchor; }`
		let result = analyze(css).properties.anchorNames
		expect(result.defined).toEqual(['--my-anchor'])
	})

	test('tracks multiple anchor names from a single declaration', () => {
		let css = `.anchor { anchor-name: --first, --second; }`
		let result = analyze(css).properties.anchorNames
		expect(result.defined).toEqual(['--first', '--second'])
	})

	test('tracks position-anchor as used', () => {
		let css = `.positioned { position-anchor: --my-anchor; }`
		let result = analyze(css).properties.anchorNames
		expect(result.used).toEqual(['--my-anchor'])
	})

	test('tracks anchor() function as used', () => {
		let css = `.positioned { position: absolute; top: anchor(--my-anchor bottom); }`
		let result = analyze(css).properties.anchorNames
		expect(result.used).toContain('--my-anchor')
	})

	test('tracks anchor-size() function as used', () => {
		let css = `.positioned { position: absolute; width: anchor-size(--my-anchor width); }`
		let result = analyze(css).properties.anchorNames
		expect(result.used).toContain('--my-anchor')
	})

	test('identifies unused anchor names', () => {
		let css = `
			.anchor { anchor-name: --tooltip; }
			.other { anchor-name: --sidebar; }
			.positioned { position-anchor: --tooltip; }
		`
		let result = analyze(css).properties.anchorNames
		expect(result.defined).toEqual(['--tooltip', '--sidebar'])
		expect(result.used).toEqual(['--tooltip'])
		expect(result.unused).toEqual(['--sidebar'])
		expect(result.unknown).toEqual([])
	})

	test('identifies unknown anchor names', () => {
		let css = `.positioned { position-anchor: --missing; }`
		let result = analyze(css).properties.anchorNames
		expect(result.unknown).toEqual(['--missing'])
		expect(result.defined).toEqual([])
	})

	test('anchor() without a named anchor does not track', () => {
		let css = `.positioned { position: absolute; top: anchor(top); }`
		let result = analyze(css).properties.anchorNames
		expect(result.used).toEqual([])
	})
})

describe('Public API exports', () => {
	test('exports DefinedUsed class', () => {
		expect(typeof DefinedUsed).toBe('function')
		expect(new DefinedUsed().constructor.name).toBe('DefinedUsed')
	})
})

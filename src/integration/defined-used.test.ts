import { test, expect, describe } from 'vitest'
import { analyze } from '../engine/analyzer.ts'
import { plain } from '../test/test-utils.ts'
import { atrules } from '../collectors/atrules.ts'
import { properties } from '../collectors/properties.ts'

function run_properties(css: string) {
	return analyze(css, { result: properties() }).result
}

function run_atrules(css: string) {
	return analyze(css, { result: atrules() }).result
}

describe('Custom properties', () => {
	test('tracks declared custom properties as defined', () => {
		const css = `:root { --color: red; --size: 16px; }`
		const result = run_properties(css).custom
		expect(result.defined).toEqual(['--color', '--size'])
	})

	test('tracks var() references as used', () => {
		const css = `.foo { color: var(--color); }`
		const result = run_properties(css).custom
		expect(result.used).toEqual(['--color'])
	})

	test('tracks VAR() references as used regardless of case', () => {
		const css = `.foo { color: VAR(--color); }`
		const result = run_properties(css).custom
		expect(result.used).toEqual(['--color'])
	})

	test('identifies unused custom properties', () => {
		const css = `:root { --color: red; --size: 16px; } .foo { color: var(--color); }`
		const result = run_properties(css).custom
		expect(result.defined).toContain('--color')
		expect(result.defined).toContain('--size')
		expect(result.unused).toEqual(['--size'])
		expect(result.unknown).toEqual([])
	})

	test('identifies unknown (undeclared) custom properties', () => {
		const css = `.foo { margin: var(--spacing); }`
		const result = run_properties(css).custom
		expect(result.defined).toEqual([])
		expect(result.unknown).toEqual(['--spacing'])
	})

	test('handles nested var() fallbacks', () => {
		const css = `.foo { color: var(--primary, var(--secondary, red)); }`
		const result = run_properties(css).custom
		expect(result.used).toContain('--primary')
		expect(result.used).toContain('--secondary')
	})

	test('tracks @property definitions', () => {
		const css = `@property --my-color { syntax: '<color>'; inherits: false; initial-value: red; }`
		const result = run_properties(css).custom
		expect(result.defined).toContain('--my-color')
	})

	test('handles all four states in a realistic example', () => {
		const css = `
			:root { --color: red; --size: 16px; }
			.foo { color: var(--color); margin: var(--spacing); }
		`
		const result = run_properties(css).custom
		expect(result.defined).toEqual(['--color', '--size'])
		expect(result.used).toEqual(['--color', '--spacing'])
		expect(result.unused).toEqual(['--size'])
		expect(result.unknown).toEqual(['--spacing'])
	})

	test('custom property self-reference counts as both defined and used', () => {
		const css = `:root { --foo: var(--foo); }`
		const result = run_properties(css).custom
		expect(result.defined).toEqual(['--foo'])
		expect(result.used).toEqual(['--foo'])
		expect(result.unused).toEqual([])
		expect(result.unknown).toEqual([])
	})
})

describe('Animation names / keyframes', () => {
	test('tracks @keyframes names as defined', () => {
		const css = `@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`
		const result = run_atrules(css).keyframes
		expect(result.defined).toEqual(['spin'])
	})

	test('tracks animation-name references as used', () => {
		const css = `.foo { animation-name: spin; }`
		const result = run_atrules(css).keyframes
		expect(result.used).toEqual(['spin'])
	})

	test('tracks animation shorthand names as used', () => {
		const css = `.foo { animation: 1s linear spin; }`
		const result = run_atrules(css).keyframes
		expect(result.used).toEqual(['spin'])
	})

	test('identifies unused keyframes', () => {
		const css = `
			@keyframes spin {}
			@keyframes fade {}
			.foo { animation-name: spin; }
		`
		const result = run_atrules(css).keyframes
		expect(result.defined).toEqual(['spin', 'fade'])
		expect(result.used).toEqual(['spin'])
		expect(result.unused).toEqual(['fade'])
		expect(result.unknown).toEqual([])
	})

	test('identifies unknown animation names', () => {
		const css = `.foo { animation-name: spin, bounce; }`
		const result = run_atrules(css).keyframes
		expect(result.unknown).toEqual(['spin', 'bounce'])
		expect(result.defined).toEqual([])
	})

	test('animation-name: none is not tracked as a used animation name', () => {
		const css = `.foo { animation-name: none; }`
		const result = run_atrules(css).keyframes
		expect(result.used).toEqual([])
	})

	test('tracks quoted animation-name references as used', () => {
		const css = `.foo { animation-name: "slide in"; }`
		const result = run_atrules(css).keyframes
		expect(result.used).toEqual(['slide in'])
	})

	test('tracks quoted animation shorthand names as used', () => {
		const css = `.foo { animation: "slide in" 1s ease; }`
		const result = run_atrules(css).keyframes
		expect(result.used).toEqual(['slide in'])
	})

	test('matches a quoted @keyframes definition with a quoted usage', () => {
		const css = `
			@keyframes "slide in" { from { opacity: 0; } to { opacity: 1; } }
			.foo { animation-name: "slide in"; }
		`
		const result = run_atrules(css).keyframes
		expect(result.defined).toEqual(['slide in'])
		expect(result.used).toEqual(['slide in'])
		expect(result.unused).toEqual([])
		expect(result.unknown).toEqual([])
	})

	test('matches a quoted @keyframes definition with an unquoted usage and vice versa', () => {
		const css = `
			@keyframes spin { from { opacity: 0; } to { opacity: 1; } }
			@keyframes "fade" { from { opacity: 0; } to { opacity: 1; } }
			.foo {
				animation-name: "spin";
				animation: fade 1s;
			}
		`
		const result = run_atrules(css).keyframes
		expect(result.defined).toEqual(['spin', 'fade'])
		expect(result.used).toEqual(['spin', 'fade'])
		expect(result.unused).toEqual([])
		expect(result.unknown).toEqual([])
	})

	test('quoted reserved keywords are tracked as used animation names, unlike their bare forms', () => {
		// `none` on its own means "no animation", but a quoted `"none"` is a
		// valid (if unusual) custom animation name per the CSS Animations spec.
		const css = `.foo { animation-name: "none", "infinite", none; }`
		const result = run_atrules(css).keyframes
		expect(result.used).toEqual(['none', 'infinite'])
		expect(result.unknown).toEqual(['none', 'infinite'])
	})

	test('handles vendor-prefixed @keyframes as defined', () => {
		const css = `@-webkit-keyframes spin {}`
		const result = run_atrules(css).keyframes
		expect(result.defined).toEqual(['spin'])
	})
})

describe('Container names', () => {
	test('tracks container-name declarations as defined', () => {
		const css = `.parent { container-name: sidebar; }`
		const result = run_atrules(css).containers.names
		expect(result.defined).toEqual(['sidebar'])
	})

	test('tracks container shorthand names as defined', () => {
		const css = `.parent { container: main / inline-size; }`
		const result = run_atrules(css).containers.names
		expect(result.defined).toEqual(['main'])
	})

	test('tracks @container query names as used', () => {
		const css = `@container sidebar (min-width: 400px) { .child { width: 100%; } }`
		const result = run_atrules(css).containers.names
		expect(result.used).toEqual(['sidebar'])
	})

	test('identifies unused container names', () => {
		const css = `
			.a { container-name: sidebar; }
			.b { container-name: main; }
			@container sidebar (min-width: 400px) { .child { width: 100%; } }
		`
		const result = run_atrules(css).containers.names
		expect(result.defined).toEqual(['sidebar', 'main'])
		expect(result.used).toEqual(['sidebar'])
		expect(result.unused).toEqual(['main'])
		expect(result.unknown).toEqual([])
	})

	test('identifies unknown container names', () => {
		const css = `@container content (min-width: 200px) { .inner { font-size: 2rem; } }`
		const result = run_atrules(css).containers.names
		expect(result.unknown).toEqual(['content'])
		expect(result.defined).toEqual([])
	})

	test('unnamed @container does not track a used name', () => {
		const css = `@container (min-width: 400px) { .child { width: 100%; } }`
		const result = run_atrules(css).containers.names
		expect(result.used).toEqual([])
	})

	test('container-name with multiple names stores each name individually', () => {
		const css = `.parent { container-name: sidebar main; }`
		const result = run_atrules(css).containers.names
		expect(result.total).toEqual(2)
		expect(result.total_unique).toEqual(2)
		expect(plain(result).unique).toEqual({ sidebar: 1, main: 1 })
		expect(result.defined).toEqual(['sidebar', 'main'])
	})

	test('container-name: none is not tracked as a defined container name', () => {
		const css = `.parent { container-name: none; }`
		const result = run_atrules(css).containers.names
		expect(result.defined).toEqual([])
		expect(result.total).toEqual(0)
	})
})

describe('Layer names', () => {
	test('tracks @layer ordering statements as defined', () => {
		const css = `@layer reset, base, theme;`
		const result = run_atrules(css).layers
		expect(result.defined).toEqual(['reset', 'base', 'theme'])
	})

	test('tracks @layer block declarations as used', () => {
		const css = `@layer reset { * { box-sizing: border-box; } }`
		const result = run_atrules(css).layers
		expect(result.used).toEqual(['reset'])
	})

	test('tracks @import layer() as used', () => {
		const css = `@import url('base.css') layer(base);`
		const result = run_atrules(css).layers
		expect(result.used).toEqual(['base'])
	})

	test('identifies unused layers (ordered but never filled)', () => {
		const css = `
			@layer reset, base, theme;
			@layer reset { * { box-sizing: border-box; } }
			@layer base { body { margin: 0; } }
		`
		const result = run_atrules(css).layers
		expect(result.defined).toEqual(['reset', 'base', 'theme'])
		expect(result.used).toEqual(['reset', 'base'])
		expect(result.unused).toEqual(['theme'])
		expect(result.unknown).toEqual([])
	})

	test('identifies unknown layers (filled but never ordered)', () => {
		const css = `@layer theme { :root { --color: red; } }`
		const result = run_atrules(css).layers
		expect(result.used).toEqual(['theme'])
		expect(result.defined).toEqual([])
		expect(result.unknown).toEqual(['theme'])
	})

	test('anonymous layers are not tracked in DefinedUsed', () => {
		const css = `@layer { .foo { color: red; } }`
		const result = run_atrules(css).layers
		expect(result.defined).toEqual([])
		expect(result.used).toEqual([])
	})
})

describe('Anchor names', () => {
	test('tracks anchor-name declarations as defined', () => {
		const css = `.anchor { anchor-name: --my-anchor; }`
		const result = run_properties(css).anchor_names
		expect(result.defined).toEqual(['--my-anchor'])
	})

	test('tracks multiple anchor names from a single declaration', () => {
		const css = `.anchor { anchor-name: --first, --second; }`
		const result = run_properties(css).anchor_names
		expect(result.defined).toEqual(['--first', '--second'])
	})

	test('tracks position-anchor as used', () => {
		const css = `.positioned { position-anchor: --my-anchor; }`
		const result = run_properties(css).anchor_names
		expect(result.used).toEqual(['--my-anchor'])
	})

	test('tracks anchor() function as used', () => {
		const css = `.positioned { position: absolute; top: anchor(--my-anchor bottom); }`
		const result = run_properties(css).anchor_names
		expect(result.used).toContain('--my-anchor')
	})

	test('tracks anchor-size() function as used', () => {
		const css = `.positioned { position: absolute; width: anchor-size(--my-anchor width); }`
		const result = run_properties(css).anchor_names
		expect(result.used).toContain('--my-anchor')
	})

	test('tracks ANCHOR() and ANCHOR-SIZE() functions as used regardless of case', () => {
		const css = `.positioned { position: absolute; top: ANCHOR(--my-anchor bottom); width: ANCHOR-SIZE(--my-anchor width); }`
		const result = run_properties(css).anchor_names
		expect(result.used).toContain('--my-anchor')
	})

	test('identifies unused anchor names', () => {
		const css = `
			.anchor { anchor-name: --tooltip; }
			.other { anchor-name: --sidebar; }
			.positioned { position-anchor: --tooltip; }
		`
		const result = run_properties(css).anchor_names
		expect(result.defined).toEqual(['--tooltip', '--sidebar'])
		expect(result.used).toEqual(['--tooltip'])
		expect(result.unused).toEqual(['--sidebar'])
		expect(result.unknown).toEqual([])
	})

	test('identifies unknown anchor names', () => {
		const css = `.positioned { position-anchor: --missing; }`
		const result = run_properties(css).anchor_names
		expect(result.unknown).toEqual(['--missing'])
		expect(result.defined).toEqual([])
	})

	test('anchor() without a named anchor does not track', () => {
		const css = `.positioned { position: absolute; top: anchor(top); }`
		const result = run_properties(css).anchor_names
		expect(result.used).toEqual([])
	})

	test('position-anchor with a non-anchor value does not track', () => {
		const css = `.positioned { position-anchor: auto; }`
		const result = run_properties(css).anchor_names
		expect(result.used).toEqual([])
	})
})

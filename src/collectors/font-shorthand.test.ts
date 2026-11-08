import { describe, test, expect } from 'vitest'
import { analyze } from '../engine/analyzer.ts'
import { plain } from '../test-utils.ts'
import { font_families } from './font-families.ts'
import { font_sizes } from './font-sizes.ts'
import { line_heights } from './line-heights.ts'

/** The `font` shorthand feeds three collectors from one split of the value */
function run(css: string) {
	const result = analyze(css, {
		font_families: font_families(),
		font_sizes: font_sizes(),
		line_heights: line_heights(),
	})
	return {
		font_families: plain(result.font_families),
		font_sizes: plain(result.font_sizes),
		line_heights: plain(result.line_heights),
	}
}

// ---------------------------------------------------------------------------
// font-family extraction
// ---------------------------------------------------------------------------

describe('font-family', () => {
	test('single quoted family', () => {
		const { font_families } = run(`a { font: large 'Noto Sans'; }`)
		expect(font_families.unique).toEqual({ "'Noto Sans'": 1 })
	})

	test('double-quoted family after size/line-height', () => {
		const { font_families } = run(`a { font: normal normal 1em/1 "Source Sans Pro", serif; }`)
		expect(font_families.unique).toEqual({ '"Source Sans Pro", serif': 1 })
	})

	test('unquoted single family', () => {
		const { font_families } = run(`a { font: normal normal 1.2em serif; }`)
		expect(font_families.unique).toEqual({ serif: 1 })
	})

	test('family after numeric weight and slash', () => {
		const { font_families } = run(`a { font: 400 1.3em/1 serif; }`)
		expect(font_families.unique).toEqual({ serif: 1 })
	})

	test('spaces around slash — "1em / 1"', () => {
		const { font_families } = run(`a { font: 1em / 1 serif; }`)
		expect(font_families.unique).toEqual({ serif: 1 })
	})

	test('slash with no leading space — "1em/ 1"', () => {
		const { font_families } = run(`a { font: 1em/ 1 serif; }`)
		expect(font_families.unique).toEqual({ serif: 1 })
	})

	test('slash with no trailing space — "1em /1"', () => {
		const { font_families } = run(`a { font: 1em /1 serif; }`)
		expect(font_families.unique).toEqual({ serif: 1 })
	})

	test('long font stack', () => {
		const { font_families } = run(
			`a { font: normal normal 11px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"; }`,
		)
		expect(font_families.unique).toEqual({
			'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"': 1,
		})
	})

	test('multiple families without line-height', () => {
		const { font_families } = run(
			`a { font: 11px Consolas, "Liberation Mono", Menlo, Courier, monospace; }`,
		)
		expect(font_families.unique).toEqual({
			'Consolas, "Liberation Mono", Menlo, Courier, monospace': 1,
		})
	})

	test('minifier trick — "0/0 a"', () => {
		const { font_families } = run(`a { font: 0/0 a; }`)
		expect(font_families.unique).toEqual({ a: 1 })
	})

	test('var() as font-family', () => {
		const { font_families } = run(
			`a { font: 12px var(--fontStack-monospace, ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace); }`,
		)
		expect(font_families.unique).toEqual({
			'var(--fontStack-monospace, ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace)': 1,
		})
	})

	test('var() as font-size, identifier as font-family', () => {
		const { font_families } = run(`a { font: var(--size) serif; }`)
		expect(font_families.unique).toEqual({ serif: 1 })
	})

	test('no font-family when only size/line-height present', () => {
		const { font_families } = run(`a { font: 1.2em/1.2em; }`)
		expect(font_families.total).toBe(0)
	})

	test('system font — single identifier is not a font-family', () => {
		// "menu" alone is a system font — no font-family should be recorded
		const { font_families } = run(`a { font: menu; }`)
		expect(font_families.total).toBe(0)
	})

	test('system font name used as font-family after explicit size', () => {
		// "large menu" — "menu" is font-family (a font named "menu")
		const { font_families } = run(`a { font: large menu; }`)
		expect(font_families.unique).toEqual({ menu: 1 })
	})

	test('global keywords are not recorded as font-families', () => {
		const { font_families } = run(`a {
			font: inherit;
			font: initial;
			font: revert;
			font: revert-layer;
			font: unset;
		}`)
		expect(font_families.total).toBe(0)
	})

	test('invalid trailing number included in font-family text', () => {
		// Real-world breakage: font: 14px "Inter Var", sans-serif, 700
		const { font_families, font_sizes } = run(`a { font: 14px "Inter Var", sans-serif, 700; }`)
		expect(font_families.unique).toEqual({ '"Inter Var", sans-serif, 700': 1 })
		expect(font_sizes.unique).toEqual({ '14px': 1 })
	})

	test('does not crash on var(--x, ) (empty fallback)', () => {
		expect(() => run(`a { font: var(--x, ); }`)).not.toThrow()
	})

	test('total and uniqueness tracking', () => {
		const fixture = `a {
			font: large 'Noto Sans';
			font: normal normal 1em/1 "Source Sans Pro", serif;
			font: normal normal 1.2em serif;
			font: 400 1.3em/1 serif;
			font: 1em / 1 serif;
			font: 1em/ 1 serif;
			font: 1em /1 serif;
			font: normal normal 11px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
			font: 11px Consolas, "Liberation Mono", Menlo, Courier, monospace;
			font: 0/0 a;
			font: 1.2em/1.2em;
			font: 12px var(--fontStack-monospace, ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace);
		}`
		const { font_families } = run(fixture)
		expect(font_families.total).toBe(11)
		expect(font_families.total_unique).toBe(7)
		expect(font_families.unique).toEqual({
			"'Noto Sans'": 1,
			'"Source Sans Pro", serif': 1,
			serif: 5,
			'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"': 1,
			'Consolas, "Liberation Mono", Menlo, Courier, monospace': 1,
			a: 1,
			'var(--fontStack-monospace, ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace)': 1,
		})
	})
})

// ---------------------------------------------------------------------------
// font-size extraction
// ---------------------------------------------------------------------------

describe('font-size', () => {
	test('absolute size keyword', () => {
		const { font_sizes } = run(`a { font: large "Noto Sans"; }`)
		expect(font_sizes.unique).toEqual({ large: 1 })
	})

	test('dimension before slash', () => {
		const { font_sizes } = run(`a { font: normal normal 1em/1 "Source Sans Pro", serif; }`)
		expect(font_sizes.unique).toEqual({ '1em': 1 })
	})

	test('dimension without slash', () => {
		const { font_sizes } = run(`a { font: normal normal 1.2em serif; }`)
		expect(font_sizes.unique).toEqual({ '1.2em': 1 })
	})

	test('dimension after numeric font-weight', () => {
		const { font_sizes } = run(`a { font: 400 1.3em/1 serif; }`)
		expect(font_sizes.unique).toEqual({ '1.3em': 1 })
	})

	test('zero with slash — minifier trick', () => {
		const { font_sizes } = run(`a { font: 0/0 a; }`)
		expect(font_sizes.unique).toEqual({ '0': 1 })
	})

	test('px size', () => {
		const { font_sizes } = run(`a { font: 12px sans-serif; }`)
		expect(font_sizes.unique).toEqual({ '12px': 1 })
	})

	test('var() as font-size', () => {
		const { font_sizes } = run(`a { font: var(--size) serif; }`)
		expect(font_sizes.unique).toEqual({ 'var(--size)': 1 })
	})

	test('var() as font-size before slash', () => {
		const { font_sizes } = run(`a { font: var(--size)/1 serif; }`)
		expect(font_sizes.unique).toEqual({ 'var(--size)': 1 })
	})

	test('no font-size when system font', () => {
		// "menu" alone is a system font
		const { font_sizes } = run(`a { font: menu; }`)
		expect(font_sizes.total).toBe(0)
	})

	test('font-size when size keyword precedes system font name', () => {
		// "large menu" — large is font-size, menu is the font-family name
		const { font_sizes } = run(`a { font: large menu; }`)
		expect(font_sizes.unique).toEqual({ large: 1 })
	})

	test('global keywords produce no font-size', () => {
		const { font_sizes } = run(`a {
			font: inherit;
			font: initial;
			font: revert;
			font: revert-layer;
			font: unset;
		}`)
		expect(font_sizes.total).toBe(0)
	})

	test('normalizes font-size to lowercase', () => {
		const { font_sizes } = run(`a { font: 10PX/1 sans-serif; }`)
		expect(font_sizes.unique).toEqual({ '10px': 1 })
	})

	test('total and uniqueness tracking', () => {
		const fixture = `a {
			font: large "Noto Sans";
			font: normal normal 1em/1 "Source Sans Pro", serif;
			font: normal normal 1.2em serif;
			font: 400 1.3em/1 serif;
			font: 1em / 1 serif;
			font: 1em/ 1 serif;
			font: 1em /1 serif;
			font: 2em/1.4em serif;
			font: normal normal 11px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
			font: 11px Consolas, "Liberation Mono", Menlo, Courier, monospace;
			font: 0/0 a;
			font: 12px sans-serif;
			font: 13px var(--fontStack-monospace);
		}`
		const { font_sizes } = run(fixture)
		expect(font_sizes.total).toBe(13)
		expect(font_sizes.unique).toEqual({
			'0': 1,
			large: 1,
			'1em': 4,
			'1.2em': 1,
			'1.3em': 1,
			'2em': 1,
			'11px': 2,
			'12px': 1,
			'13px': 1,
		})
	})
})

// ---------------------------------------------------------------------------
// line-height extraction
// ---------------------------------------------------------------------------

describe('line-height', () => {
	test('unitless number after slash', () => {
		const { line_heights } = run(`a { font: normal normal 1em/1 "Source Sans Pro", serif; }`)
		expect(line_heights.unique).toEqual({ '1': 1 })
	})

	test('no line-height when no slash', () => {
		const { line_heights } = run(`a { font: 1.2em serif; }`)
		expect(line_heights.total).toBe(0)
	})

	test('decimal line-height', () => {
		const { line_heights } = run(`a { font: 11px/1.5 Arial; }`)
		expect(line_heights.unique).toEqual({ '1.5': 1 })
	})

	test('dimension line-height', () => {
		const { line_heights } = run(`a { font: 1.2em/1.2em; }`)
		expect(line_heights.unique).toEqual({ '1.2em': 1 })
	})

	test('zero line-height — minifier trick', () => {
		const { line_heights } = run(`a { font: 0/0 a; }`)
		expect(line_heights.unique).toEqual({ '0': 1 })
	})

	test('var() as line-height', () => {
		const { line_heights } = run(`a { font: 12px/var(--lh) serif; }`)
		expect(line_heights.unique).toEqual({ 'var(--lh)': 1 })
	})

	test('no line-height for system fonts', () => {
		const { line_heights } = run(`a {
			font: menu;
			font: large menu;
		}`)
		expect(line_heights.total).toBe(0)
	})

	test('global keywords produce no line-height', () => {
		const { line_heights } = run(`a {
			font: inherit;
			font: initial;
			font: revert;
			font: revert-layer;
			font: unset;
		}`)
		expect(line_heights.total).toBe(0)
	})

	test('normalizes line-height to lowercase', () => {
		const { line_heights } = run(`a { font: 10PX/1EM serif; }`)
		expect(line_heights.unique).toEqual({ '1em': 1 })
	})

	test('total and uniqueness tracking', () => {
		const fixture = `a {
			font: large 'Noto Sans';
			font: normal normal 1em/1 "Source Sans Pro", serif;
			font: normal normal 1.2em serif;
			font: 400 1.3em/1 serif;
			font: 1em / 1 serif;
			font: 1em/ 1 serif;
			font: 1em /1 serif;
			font: normal normal 11px/1.5 -apple-system, BlinkMacSystemFont;
			font: 11px Consolas, monospace;
			font: 0/0 a;
		}`
		const { line_heights } = run(fixture)
		expect(line_heights.total).toBe(7)
		expect(line_heights.unique).toEqual({
			'1': 5,
			'1.5': 1,
			'0': 1,
		})
	})
})

// ---------------------------------------------------------------------------
// var() handling
// ---------------------------------------------------------------------------

describe('var() usage', () => {
	test('single lone var() returns no components (whole-value var)', () => {
		// var() alone could represent the entire shorthand — nothing to extract
		const result = run(`a { font: var(--font); }`)
		expect(result.font_families.total).toBe(0)
		expect(result.font_sizes.total).toBe(0)
		expect(result.line_heights.total).toBe(0)
	})

	test('var() with empty fallback does not crash', () => {
		expect(() => run(`a { font: var(--x, ); }`)).not.toThrow()
	})

	test('var() as font-size + identifier as font-family', () => {
		const { font_sizes, font_families } = run(`a { font: var(--fs) serif; }`)
		expect(font_sizes.unique).toEqual({ 'var(--fs)': 1 })
		expect(font_families.unique).toEqual({ serif: 1 })
	})

	test('var() as font-family after explicit size', () => {
		const { font_sizes, font_families } = run(`a { font: 12px var(--family); }`)
		expect(font_sizes.unique).toEqual({ '12px': 1 })
		expect(font_families.unique).toEqual({ 'var(--family)': 1 })
	})

	test('var() as font-size before slash', () => {
		const { font_sizes, line_heights, font_families } = run(`a { font: var(--fs)/1.5 serif; }`)
		expect(font_sizes.unique).toEqual({ 'var(--fs)': 1 })
		expect(line_heights.unique).toEqual({ '1.5': 1 })
		expect(font_families.unique).toEqual({ serif: 1 })
	})

	test('var() as line-height after slash', () => {
		const { font_sizes, line_heights, font_families } = run(`a { font: 14px/var(--lh) "Arial"; }`)
		expect(font_sizes.unique).toEqual({ '14px': 1 })
		expect(line_heights.unique).toEqual({ 'var(--lh)': 1 })
		expect(font_families.unique).toEqual({ '"Arial"': 1 })
	})

	test('complex var() fallback as font-family', () => {
		const { font_sizes, font_families } = run(
			`a { font: 12px var(--fontStack-monospace, ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace); }`,
		)
		expect(font_sizes.unique).toEqual({ '12px': 1 })
		expect(font_families.unique).toEqual({
			'var(--fontStack-monospace, ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace)': 1,
		})
	})
})

// ---------------------------------------------------------------------------
// pre-font-size modifier keywords
// ---------------------------------------------------------------------------

describe('pre-font-size modifiers', () => {
	test('italic before size', () => {
		const { font_sizes, font_families } = run(`a { font: italic 16px serif; }`)
		expect(font_sizes.unique).toEqual({ '16px': 1 })
		expect(font_families.unique).toEqual({ serif: 1 })
	})

	test('bold before size', () => {
		const { font_sizes } = run(`a { font: bold 1rem monospace; }`)
		expect(font_sizes.unique).toEqual({ '1rem': 1 })
	})

	test('numeric weight before dimension size', () => {
		const { font_sizes, font_families } = run(`a { font: 700 1.25em sans-serif; }`)
		expect(font_sizes.unique).toEqual({ '1.25em': 1 })
		expect(font_families.unique).toEqual({ 'sans-serif': 1 })
	})

	test('small-caps + bold + condensed + size', () => {
		const { font_sizes, font_families } = run(
			`a { font: small-caps bold condensed 14px/1.4 "My Font", serif; }`,
		)
		expect(font_sizes.unique).toEqual({ '14px': 1 })
		expect(font_families.unique).toEqual({ '"My Font", serif': 1 })
	})

	test('normal normal before size', () => {
		const { font_sizes, font_families } = run(
			`a { font: normal normal 1em/1 "Source Sans Pro", serif; }`,
		)
		expect(font_sizes.unique).toEqual({ '1em': 1 })
		expect(font_families.unique).toEqual({ '"Source Sans Pro", serif': 1 })
	})
})

// ---------------------------------------------------------------------------
// Real-world edge cases
// ---------------------------------------------------------------------------

describe('real-world edge cases', () => {
	test('var() as font-size with numeric weight and long font stack (GitHub-style)', () => {
		// font:400 var(--primer-text-title-size-large, 2rem) -apple-system,...
		const css = `a { font:400 var(--primer-text-title-size-large, 2rem) -apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji"; }`
		const { font_sizes, font_families } = run(css)
		expect(font_sizes.unique).toEqual({ 'var(--primer-text-title-size-large, 2rem)': 1 })
		expect(font_families.unique).toEqual({
			'-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji"': 1,
		})
	})

	test('percentage font-size with multi-word unquoted font family', () => {
		// 100% Source Code Pro, Inconsolata, Menlo, monospace
		const css = `a { font: 100% Source Code Pro, Inconsolata, Menlo, monospace; }`
		const { font_sizes, font_families } = run(css)
		expect(font_sizes.unique).toEqual({ '100%': 1 })
		expect(font_families.unique).toEqual({
			'Source Code Pro, Inconsolata, Menlo, monospace': 1,
		})
	})
})

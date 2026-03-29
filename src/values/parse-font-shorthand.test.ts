import { describe, test, expect } from 'vitest'
import { analyze } from '../index.js'

// ---------------------------------------------------------------------------
// font-family extraction
// ---------------------------------------------------------------------------

describe('font-family', () => {
	test('single quoted family', () => {
		const { fontFamilies } = analyze(`a { font: large 'Noto Sans'; }`).values
		expect(fontFamilies.unique).toEqual({ "'Noto Sans'": 1 })
	})

	test('double-quoted family after size/line-height', () => {
		const { fontFamilies } = analyze(
			`a { font: normal normal 1em/1 "Source Sans Pro", serif; }`,
		).values
		expect(fontFamilies.unique).toEqual({ '"Source Sans Pro", serif': 1 })
	})

	test('unquoted single family', () => {
		const { fontFamilies } = analyze(`a { font: normal normal 1.2em serif; }`).values
		expect(fontFamilies.unique).toEqual({ serif: 1 })
	})

	test('family after numeric weight and slash', () => {
		const { fontFamilies } = analyze(`a { font: 400 1.3em/1 serif; }`).values
		expect(fontFamilies.unique).toEqual({ serif: 1 })
	})

	test('spaces around slash — "1em / 1"', () => {
		const { fontFamilies } = analyze(`a { font: 1em / 1 serif; }`).values
		expect(fontFamilies.unique).toEqual({ serif: 1 })
	})

	test('slash with no leading space — "1em/ 1"', () => {
		const { fontFamilies } = analyze(`a { font: 1em/ 1 serif; }`).values
		expect(fontFamilies.unique).toEqual({ serif: 1 })
	})

	test('slash with no trailing space — "1em /1"', () => {
		const { fontFamilies } = analyze(`a { font: 1em /1 serif; }`).values
		expect(fontFamilies.unique).toEqual({ serif: 1 })
	})

	test('long font stack', () => {
		const { fontFamilies } = analyze(
			`a { font: normal normal 11px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"; }`,
		).values
		expect(fontFamilies.unique).toEqual({
			'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"': 1,
		})
	})

	test('multiple families without line-height', () => {
		const { fontFamilies } = analyze(
			`a { font: 11px Consolas, "Liberation Mono", Menlo, Courier, monospace; }`,
		).values
		expect(fontFamilies.unique).toEqual({
			'Consolas, "Liberation Mono", Menlo, Courier, monospace': 1,
		})
	})

	test('minifier trick — "0/0 a"', () => {
		const { fontFamilies } = analyze(`a { font: 0/0 a; }`).values
		expect(fontFamilies.unique).toEqual({ a: 1 })
	})

	test('var() as font-family', () => {
		const { fontFamilies } = analyze(
			`a { font: 12px var(--fontStack-monospace, ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace); }`,
		).values
		expect(fontFamilies.unique).toEqual({
			'var(--fontStack-monospace, ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace)': 1,
		})
	})

	test('var() as font-size, identifier as font-family', () => {
		const { fontFamilies } = analyze(`a { font: var(--size) serif; }`).values
		expect(fontFamilies.unique).toEqual({ serif: 1 })
	})

	test('no font-family when only size/line-height present', () => {
		const { fontFamilies } = analyze(`a { font: 1.2em/1.2em; }`).values
		expect(fontFamilies.total).toBe(0)
	})

	test('system font — single identifier is not a font-family', () => {
		// "menu" alone is a system font — no font-family should be recorded
		const { fontFamilies } = analyze(`a { font: menu; }`).values
		expect(fontFamilies.total).toBe(0)
	})

	test('system font name used as font-family after explicit size', () => {
		// "large menu" — "menu" is font-family (a font named "menu")
		const { fontFamilies } = analyze(`a { font: large menu; }`).values
		expect(fontFamilies.unique).toEqual({ menu: 1 })
	})

	test('global keywords are not recorded as font-families', () => {
		const { fontFamilies } = analyze(`a {
			font: inherit;
			font: initial;
			font: revert;
			font: revert-layer;
			font: unset;
		}`).values
		expect(fontFamilies.total).toBe(0)
	})

	test('invalid trailing number included in font-family text', () => {
		// Real-world breakage: font: 14px "Inter Var", sans-serif, 700
		const { fontFamilies, fontSizes } = analyze(
			`a { font: 14px "Inter Var", sans-serif, 700; }`,
		).values
		expect(fontFamilies.unique).toEqual({ '"Inter Var", sans-serif, 700': 1 })
		expect(fontSizes.unique).toEqual({ '14px': 1 })
	})

	test('does not crash on var(--x, ) (empty fallback)', () => {
		expect(() => analyze(`a { font: var(--x, ); }`).values.fontFamilies).not.toThrow()
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
		const { fontFamilies } = analyze(fixture).values
		expect(fontFamilies.total).toBe(11)
		expect(fontFamilies.totalUnique).toBe(7)
		expect(fontFamilies.unique).toEqual({
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
		const { fontSizes } = analyze(`a { font: large "Noto Sans"; }`).values
		expect(fontSizes.unique).toEqual({ large: 1 })
	})

	test('dimension before slash', () => {
		const { fontSizes } = analyze(`a { font: normal normal 1em/1 "Source Sans Pro", serif; }`).values
		expect(fontSizes.unique).toEqual({ '1em': 1 })
	})

	test('dimension without slash', () => {
		const { fontSizes } = analyze(`a { font: normal normal 1.2em serif; }`).values
		expect(fontSizes.unique).toEqual({ '1.2em': 1 })
	})

	test('dimension after numeric font-weight', () => {
		const { fontSizes } = analyze(`a { font: 400 1.3em/1 serif; }`).values
		expect(fontSizes.unique).toEqual({ '1.3em': 1 })
	})

	test('zero with slash — minifier trick', () => {
		const { fontSizes } = analyze(`a { font: 0/0 a; }`).values
		expect(fontSizes.unique).toEqual({ '0': 1 })
	})

	test('px size', () => {
		const { fontSizes } = analyze(`a { font: 12px sans-serif; }`).values
		expect(fontSizes.unique).toEqual({ '12px': 1 })
	})

	test('var() as font-size', () => {
		const { fontSizes } = analyze(`a { font: var(--size) serif; }`).values
		expect(fontSizes.unique).toEqual({ 'var(--size)': 1 })
	})

	test('var() as font-size before slash', () => {
		const { fontSizes } = analyze(`a { font: var(--size)/1 serif; }`).values
		expect(fontSizes.unique).toEqual({ 'var(--size)': 1 })
	})

	test('no font-size when system font', () => {
		// "menu" alone is a system font
		const { fontSizes } = analyze(`a { font: menu; }`).values
		expect(fontSizes.total).toBe(0)
	})

	test('font-size when size keyword precedes system font name', () => {
		// "large menu" — large is font-size, menu is the font-family name
		const { fontSizes } = analyze(`a { font: large menu; }`).values
		expect(fontSizes.unique).toEqual({ large: 1 })
	})

	test('global keywords produce no font-size', () => {
		const { fontSizes } = analyze(`a {
			font: inherit;
			font: initial;
			font: revert;
			font: revert-layer;
			font: unset;
		}`).values
		expect(fontSizes.total).toBe(0)
	})

	test('normalizes font-size to lowercase', () => {
		const { fontSizes } = analyze(`a { font: 10PX/1 sans-serif; }`).values
		expect(fontSizes.unique).toEqual({ '10px': 1 })
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
		const { fontSizes } = analyze(fixture).values
		expect(fontSizes.total).toBe(13)
		expect(fontSizes.unique).toEqual({
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
		const { lineHeights } = analyze(`a { font: normal normal 1em/1 "Source Sans Pro", serif; }`).values
		expect(lineHeights.unique).toEqual({ '1': 1 })
	})

	test('no line-height when no slash', () => {
		const { lineHeights } = analyze(`a { font: 1.2em serif; }`).values
		expect(lineHeights.total).toBe(0)
	})

	test('decimal line-height', () => {
		const { lineHeights } = analyze(`a { font: 11px/1.5 Arial; }`).values
		expect(lineHeights.unique).toEqual({ '1.5': 1 })
	})

	test('dimension line-height', () => {
		const { lineHeights } = analyze(`a { font: 1.2em/1.2em; }`).values
		expect(lineHeights.unique).toEqual({ '1.2em': 1 })
	})

	test('zero line-height — minifier trick', () => {
		const { lineHeights } = analyze(`a { font: 0/0 a; }`).values
		expect(lineHeights.unique).toEqual({ '0': 1 })
	})

	test('var() as line-height', () => {
		const { lineHeights } = analyze(`a { font: 12px/var(--lh) serif; }`).values
		expect(lineHeights.unique).toEqual({ 'var(--lh)': 1 })
	})

	test('no line-height for system fonts', () => {
		const { lineHeights } = analyze(`a {
			font: menu;
			font: large menu;
		}`).values
		expect(lineHeights.total).toBe(0)
	})

	test('global keywords produce no line-height', () => {
		const { lineHeights } = analyze(`a {
			font: inherit;
			font: initial;
			font: revert;
			font: revert-layer;
			font: unset;
		}`).values
		expect(lineHeights.total).toBe(0)
	})

	test('normalizes line-height to lowercase', () => {
		const { lineHeights } = analyze(`a { font: 10PX/1EM serif; }`).values
		expect(lineHeights.unique).toEqual({ '1em': 1 })
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
		const { lineHeights } = analyze(fixture).values
		expect(lineHeights.total).toBe(7)
		expect(lineHeights.unique).toEqual({
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
		const result = analyze(`a { font: var(--font); }`).values
		expect(result.fontFamilies.total).toBe(0)
		expect(result.fontSizes.total).toBe(0)
		expect(result.lineHeights.total).toBe(0)
	})

	test('var() with empty fallback does not crash', () => {
		expect(() => analyze(`a { font: var(--x, ); }`)).not.toThrow()
	})

	test('var() as font-size + identifier as font-family', () => {
		const { fontSizes, fontFamilies } = analyze(`a { font: var(--fs) serif; }`).values
		expect(fontSizes.unique).toEqual({ 'var(--fs)': 1 })
		expect(fontFamilies.unique).toEqual({ serif: 1 })
	})

	test('var() as font-family after explicit size', () => {
		const { fontSizes, fontFamilies } = analyze(`a { font: 12px var(--family); }`).values
		expect(fontSizes.unique).toEqual({ '12px': 1 })
		expect(fontFamilies.unique).toEqual({ 'var(--family)': 1 })
	})

	test('var() as font-size before slash', () => {
		const { fontSizes, lineHeights, fontFamilies } = analyze(
			`a { font: var(--fs)/1.5 serif; }`,
		).values
		expect(fontSizes.unique).toEqual({ 'var(--fs)': 1 })
		expect(lineHeights.unique).toEqual({ '1.5': 1 })
		expect(fontFamilies.unique).toEqual({ serif: 1 })
	})

	test('var() as line-height after slash', () => {
		const { fontSizes, lineHeights, fontFamilies } = analyze(
			`a { font: 14px/var(--lh) "Arial"; }`,
		).values
		expect(fontSizes.unique).toEqual({ '14px': 1 })
		expect(lineHeights.unique).toEqual({ 'var(--lh)': 1 })
		expect(fontFamilies.unique).toEqual({ '"Arial"': 1 })
	})

	test('complex var() fallback as font-family', () => {
		const { fontSizes, fontFamilies } = analyze(
			`a { font: 12px var(--fontStack-monospace, ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace); }`,
		).values
		expect(fontSizes.unique).toEqual({ '12px': 1 })
		expect(fontFamilies.unique).toEqual({
			'var(--fontStack-monospace, ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace)': 1,
		})
	})
})

// ---------------------------------------------------------------------------
// keyword tracking
// ---------------------------------------------------------------------------

describe('keyword tracking', () => {
	test('global keywords inside font shorthand are counted', () => {
		// "inherit" appears after font-family — unusual but should be recorded
		const { keywords } = analyze(
			`a { font: italic bold 16px/1.5 Arial, sans-serif inherit; }`,
		).values
		expect(keywords.unique['inherit']).toBe(1)
	})

	test('global value for the whole font property is counted as keyword', () => {
		const { keywords } = analyze(`a {
			font: inherit;
			font: initial;
			font: revert;
			font: revert-layer;
			font: unset;
		}`).values
		expect(keywords.unique).toEqual({
			inherit: 1,
			initial: 1,
			revert: 1,
			'revert-layer': 1,
			unset: 1,
		})
	})

	test('uppercased keyword is normalised', () => {
		const { keywords } = analyze(`a { font: 10PX/12PX INHERIT; }`).values
		expect(keywords.unique).toEqual({ inherit: 1 })
	})
})

// ---------------------------------------------------------------------------
// pre-font-size modifier keywords
// ---------------------------------------------------------------------------

describe('pre-font-size modifiers', () => {
	test('italic before size', () => {
		const { fontSizes, fontFamilies } = analyze(`a { font: italic 16px serif; }`).values
		expect(fontSizes.unique).toEqual({ '16px': 1 })
		expect(fontFamilies.unique).toEqual({ serif: 1 })
	})

	test('bold before size', () => {
		const { fontSizes } = analyze(`a { font: bold 1rem monospace; }`).values
		expect(fontSizes.unique).toEqual({ '1rem': 1 })
	})

	test('numeric weight before dimension size', () => {
		const { fontSizes, fontFamilies } = analyze(`a { font: 700 1.25em sans-serif; }`).values
		expect(fontSizes.unique).toEqual({ '1.25em': 1 })
		expect(fontFamilies.unique).toEqual({ 'sans-serif': 1 })
	})

	test('small-caps + bold + condensed + size', () => {
		const { fontSizes, fontFamilies } = analyze(
			`a { font: small-caps bold condensed 14px/1.4 "My Font", serif; }`,
		).values
		expect(fontSizes.unique).toEqual({ '14px': 1 })
		expect(fontFamilies.unique).toEqual({ '"My Font", serif': 1 })
	})

	test('normal normal before size', () => {
		const { fontSizes, fontFamilies } = analyze(
			`a { font: normal normal 1em/1 "Source Sans Pro", serif; }`,
		).values
		expect(fontSizes.unique).toEqual({ '1em': 1 })
		expect(fontFamilies.unique).toEqual({ '"Source Sans Pro", serif': 1 })
	})
})

// ---------------------------------------------------------------------------
// Real-world edge cases
// ---------------------------------------------------------------------------

describe('real-world edge cases', () => {
	test('var() as font-size with numeric weight and long font stack (GitHub-style)', () => {
		// font:400 var(--primer-text-title-size-large, 2rem) -apple-system,...
		const css = `a { font:400 var(--primer-text-title-size-large, 2rem) -apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji"; }`
		const { fontSizes, fontFamilies } = analyze(css).values
		expect(fontSizes.unique).toEqual({ 'var(--primer-text-title-size-large, 2rem)': 1 })
		expect(fontFamilies.unique).toEqual({
			'-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji"': 1,
		})
	})

	test('percentage font-size with multi-word unquoted font family', () => {
		// 100% Source Code Pro, Inconsolata, Menlo, monospace
		const css = `a { font: 100% Source Code Pro, Inconsolata, Menlo, monospace; }`
		const { fontSizes, fontFamilies } = analyze(css).values
		expect(fontSizes.unique).toEqual({ '100%': 1 })
		expect(fontFamilies.unique).toEqual({
			'Source Code Pro, Inconsolata, Menlo, monospace': 1,
		})
	})
})

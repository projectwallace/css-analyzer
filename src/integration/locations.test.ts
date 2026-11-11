import { test, expect } from 'vitest'
import { analyze } from '../engine/analyzer.ts'
import { atrules, colors, properties, selectors, stylesheet } from '../collectors/index.ts'

/** The text a location points at */
function text_at(css: string, loc: { offset: number; length: number }): string {
	return css.slice(loc.offset, loc.offset + loc.length)
}

test('colors list where they were found', () => {
	const css = `
    thing {
      color: red;
      color: #f00;
      color: rgb(255, 0, 0);
      background-color: red;
    }
  `
	const { colors: result } = analyze(css, { colors: colors({ locations: true }) })

	expect(result.unique.get('red')?.locations).toEqual([
		{ line: 3, column: 14, offset: 26, length: 3 },
		{ line: 6, column: 25, offset: 103, length: 3 },
	])
	expect(result.unique.get('#f00')?.locations).toEqual([
		{ line: 4, column: 14, offset: 44, length: 4 },
	])
	expect(result.unique.get('rgb(255, 0, 0)')?.locations).toEqual([
		{ line: 5, column: 14, offset: 63, length: 14 },
	])
})

test('properties point at the property name', () => {
	const css = `
    properties {
      margin: 0;
    }
  `
	const { properties: result } = analyze(css, { properties: properties({ locations: true }) })
	expect(result.unique.get('margin')?.locations).toEqual([
		{ offset: 24, length: 6, column: 7, line: 3 },
	])
})

test('embedded content lists the url() that holds it', () => {
	const css = `
    a { background: url(data:image/gif;base64,R0lGODlhAQABAAAAACw=) }
    b { background: url("data:image/svg+xml,%3Csvg%3E%3C/svg%3E") }
    c { background: url(data:image/svg+xml,%3Csvg%3E%3C/svg%3E) }
  `
	const { sheet } = analyze(css, { sheet: stylesheet({ locations: true }) })
	const gif = sheet.embedded.types.get('image/gif')!
	const svg = sheet.embedded.types.get('image/svg+xml')!

	expect(gif.count).toBe(1)
	expect(gif.locations?.map((loc) => text_at(css, loc))).toEqual([
		'url(data:image/gif;base64,R0lGODlhAQABAAAAACw=)',
	])
	expect(svg.locations?.map((loc) => text_at(css, loc))).toEqual([
		'url("data:image/svg+xml,%3Csvg%3E%3C/svg%3E")',
		'url(data:image/svg+xml,%3Csvg%3E%3C/svg%3E)',
	])
})

test('@font-face locations come in source order, nested ones included', () => {
	const css = `
    @font-face { font-family: A; src: url(a.woff2) }
    @media (min-width: 1000px) {
      @font-face { font-family: B; src: url(b.woff2) }
    }`
	const { atrules: result } = analyze(css, { atrules: atrules({ locations: true }) })

	expect(result.font_faces.total).toBe(2)
	expect(result.font_faces.locations?.map((loc) => [loc.line, loc.column])).toEqual([
		[2, 5],
		[4, 7],
	])
	expect(result.font_faces.locations?.map((loc) => text_at(css, loc).slice(0, 10))).toEqual([
		'@font-face',
		'@font-face',
	])
})

test('combinators point at the combinator, also when it is a line break', () => {
	const css = `
    a b,
    a > b,
    a
      b,
    a:not(b) c,
    a[attr] b {}
  `
	const { selectors: result } = analyze(css, { selectors: selectors({ locations: true }) })
	const descendant = result.combinators.unique.get(' ')?.locations
	const child = result.combinators.unique.get('>')?.locations

	expect(descendant).toEqual([
		{ line: 2, column: 6, offset: 6, length: 1 },
		{ line: 4, column: 6, offset: 26, length: 1 },
		{ line: 6, column: 13, offset: 48, length: 1 },
		{ line: 7, column: 12, offset: 63, length: 1 },
	])
	expect(child).toEqual([{ line: 3, column: 7, offset: 16, length: 1 }])
	expect(descendant?.map((loc) => text_at(css, loc))).toEqual([' ', '\n', ' ', ' '])
})

test('selector kinds point at the whole selector that holds them', () => {
	const css = `
			a:hover,
			a:lang(en) {}`
	const { selectors: result } = analyze(css, { selectors: selectors({ locations: true }) })

	expect(result.pseudo_classes.unique.get('hover')?.locations).toEqual([
		{ line: 2, column: 4, offset: 4, length: 7 },
	])
	expect(result.pseudo_classes.unique.get('lang')?.locations).toEqual([
		{ line: 3, column: 4, offset: 16, length: 10 },
	])
})

test('selector complexity lists the selectors per value, however deep they are nested', () => {
	const css = `
    rule {
      color: green;
    }

    @media print {
      @media (min-width: 1000px) {
        @supports (display: grid) {
          another-rule {
            color: purple;
          }
        }
      }
    }
  `
	const { selectors: result } = analyze(css, { selectors: selectors({ locations: true }) })
	expect(result.complexity.unique.get(1)?.locations).toEqual([
		{ line: 2, column: 5, offset: 5, length: 4 },
		{ line: 9, column: 11, offset: 139, length: 12 },
	])
})

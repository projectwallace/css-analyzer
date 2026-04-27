import { test } from 'vitest'
import { expect } from 'vitest'
import { analyze } from '../index.js'

test('finds hacks', () => {
	const fixture = `
    value-browserhacks {
      property: value !ie;
      property: value !IE;
      property: value !test;
      property: value!nospace;
      property: value\\9;
    }
  `
	const actual = analyze(fixture).values.browserhacks
	const expected = {
		total: 5,
		totalUnique: 2,
		unique: {
			'!ie': 4,
			'\\9': 1,
		},
		uniquenessRatio: 2 / 5,
	}
	expect(actual).toEqual(expected)
})

test('reports no false positives', () => {
	const fixture = `
    value-browserhacks {
      property: value !important;
      content: '!important';
      margin: 0 !IMPORTANT;
      margin: 0 !important;
      aspect-ratio: 16/9;
    }
  `
	const actual = analyze(fixture).values.browserhacks
	const expected = {
		total: 0,
		totalUnique: 0,
		unique: {},
		uniquenessRatio: 0,
	}
	expect(actual).toEqual(expected)
})

test('detects progid: DXImageTransform filter hack', () => {
	const fixture = `
    a {
      filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#FF0000', endColorstr='#00FF00');
    }
  `
	const actual = analyze(fixture).values.browserhacks
	expect(actual.total).toBe(1)
	expect(actual.unique).toMatchObject({ 'progid:': 1 })
})

test('detects progid: hack within quoted value', () => {
	const fixture = `
    a {
      filter: 'progid:DXImageTransform.Microsoft.gradient(startColorstr="#FF0000", endColorstr="#00FF00")';
    }
  `
	const actual = analyze(fixture).values.browserhacks
	expect(actual.total).toBe(1)
	expect(actual.unique).toMatchObject({ 'progid:': 1 })
})

test('detects progid: hack case-insensitively', () => {
	const fixture = `a { filter: PROGID:DXImageTransform.Microsoft.gradient(); }`
	const actual = analyze(fixture).values.browserhacks
	expect(actual.total).toBe(1)
	expect(actual.unique).toMatchObject({ 'progid:': 1 })
})

test('detects trailing \\9 hack (IE9)', () => {
	const fixture = `a { color: red\\9; }`
	const actual = analyze(fixture).values.browserhacks
	expect(actual.total).toBe(1)
	expect(actual.unique).toMatchObject({ '\\9': 1 })
})

test('detects trailing \\7 hack (IE7)', () => {
	const fixture = `a { height: 100px\\7; }`
	const actual = analyze(fixture).values.browserhacks
	expect(actual.total).toBe(1)
	expect(actual.unique).toMatchObject({ '\\7': 1 })
})

test('detects alpha(opacity=) IE opacity hack', () => {
	const fixture = `a { filter: alpha(opacity=50); }`
	const actual = analyze(fixture).values.browserhacks
	expect(actual.total).toBe(1)
	expect(actual.unique).toMatchObject({ 'alpha()': 1 })
})

test('detects alpha() hack case-insensitively', () => {
	const fixture = `a { filter: Alpha(opacity=50); }`
	const actual = analyze(fixture).values.browserhacks
	expect(actual.total).toBe(1)
	expect(actual.unique).toMatchObject({ 'alpha()': 1 })
})

test('detects behavior .htc hack', () => {
	const fixture = `a { behavior: url(/assets/pie.htc); }`
	const actual = analyze(fixture).values.browserhacks
	expect(actual.total).toBe(1)
	expect(actual.unique).toMatchObject({ '.htc': 1 })
})

test('detects behavior .htc hack in quoted URL', () => {
	const fixture = `a { behavior: url('/assets/pie.htc'); }`
	const actual = analyze(fixture).values.browserhacks
	expect(actual.total).toBe(1)
	expect(actual.unique).toMatchObject({ '.htc': 1 })
})

test('detects behavior .htc hack case-insensitively', () => {
	const fixture = `a { behavior: url(/assets/pie.HTC); }`
	const actual = analyze(fixture).values.browserhacks
	expect(actual.total).toBe(1)
	expect(actual.unique).toMatchObject({ '.htc': 1 })
})

test('detects expression() IE hack', () => {
	const fixture = `a { width: expression(document.body.clientWidth - 20 + 'px'); }`
	const actual = analyze(fixture).values.browserhacks
	expect(actual.total).toBe(1)
	expect(actual.unique).toMatchObject({ 'expression()': 1 })
})

test('detects expression() hack case-insensitively', () => {
	const fixture = `a { width: Expression(document.body.clientWidth); }`
	const actual = analyze(fixture).values.browserhacks
	expect(actual.total).toBe(1)
	expect(actual.unique).toMatchObject({ 'expression()': 1 })
})

test('counts multiple declarations with the same hack', () => {
	const fixture = `
    a {
      filter: alpha(opacity=50);
      behavior: url(/assets/pie.htc);
      filter: alpha(opacity=80);
    }
  `
	const actual = analyze(fixture).values.browserhacks
	expect(actual.total).toBe(3)
	expect(actual.totalUnique).toBe(2)
	expect(actual.unique).toMatchObject({ 'alpha()': 2, '.htc': 1 })
})

test('no false positive: url() without .htc extension', () => {
	const fixture = `
    a {
      background: url(/assets/image.png);
      content: url('/fonts/icon.woff2');
    }
  `
	const actual = analyze(fixture).values.browserhacks
	expect(actual.total).toBe(0)
})

test('no false positive: gradient() without progid', () => {
	const fixture = `
    a {
      background: linear-gradient(red, blue);
      background: radial-gradient(circle, #fff, #000);
    }
  `
	const actual = analyze(fixture).values.browserhacks
	expect(actual.total).toBe(0)
})

test('no false positive: custom properties are not flagged for \\9 hack', () => {
	const fixture = `a { --my-color: red\\9; }`
	const actual = analyze(fixture).values.browserhacks
	expect(actual.total).toBe(0)
})

test('no false positive: custom properties are not flagged for \\7 hack', () => {
	const fixture = `a { --my-size: 100px\\7; }`
	const actual = analyze(fixture).values.browserhacks
	expect(actual.total).toBe(0)
})

test('no false positive: custom properties are not flagged for progid:', () => {
	const fixture = `a { --filter: progid:DXImageTransform.Microsoft.gradient(); }`
	const actual = analyze(fixture).values.browserhacks
	expect(actual.total).toBe(0)
})

test('no false positive: custom properties are not flagged for alpha()', () => {
	const fixture = `a { --opacity: alpha(opacity=50); }`
	const actual = analyze(fixture).values.browserhacks
	expect(actual.total).toBe(0)
})

test('no false positive: custom properties are not flagged for expression()', () => {
	const fixture = `a { --width: expression(document.body.clientWidth); }`
	const actual = analyze(fixture).values.browserhacks
	expect(actual.total).toBe(0)
})

test('no false positive: custom properties are not flagged for .htc url', () => {
	const fixture = `a { --behavior: url(/assets/pie.htc); }`
	const actual = analyze(fixture).values.browserhacks
	expect(actual.total).toBe(0)
})

test('no false positive: aspect-ratio with slash is not a \\7 hack', () => {
	const fixture = `a { aspect-ratio: 16/7; }`
	const actual = analyze(fixture).values.browserhacks
	expect(actual.total).toBe(0)
})

test('no false positive: regular identifier ending in 7 is not a hack', () => {
	const fixture = `a { grid-area: col7; }`
	const actual = analyze(fixture).values.browserhacks
	expect(actual.total).toBe(0)
})

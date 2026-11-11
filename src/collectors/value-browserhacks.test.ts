import { test, expect } from 'vitest'
import { analyze } from '../engine/analyzer.ts'
import { plain } from '../test/test-utils.ts'
import { value_browserhacks } from './value-browserhacks.ts'

function run(css: string) {
	return plain(analyze(css, { result: value_browserhacks() }).result)
}

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
	const actual = run(fixture)
	const expected = {
		total: 5,
		total_unique: 2,
		unique: {
			'!ie': 4,
			'\\9': 1,
		},
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
	const actual = run(fixture)
	const expected = {
		total: 0,
		total_unique: 0,
		unique: {},
	}
	expect(actual).toEqual(expected)
})

test.each([
	[
		'progid: DXImageTransform filter',
		`a { filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#FF0000', endColorstr='#00FF00'); }`,
		'progid:',
	],
	[
		'progid: within a quoted value',
		`a { filter: 'progid:DXImageTransform.Microsoft.gradient(startColorstr="#FF0000", endColorstr="#00FF00")'; }`,
		'progid:',
	],
	[
		'progid: case-insensitively',
		`a { filter: PROGID:DXImageTransform.Microsoft.gradient(); }`,
		'progid:',
	],
	['trailing \\9 (IE9)', `a { color: red\\9; }`, '\\9'],
	['trailing \\7 (IE7)', `a { height: 100px\\7; }`, '\\7'],
	['alpha(opacity=)', `a { filter: alpha(opacity=50); }`, 'alpha()'],
	['alpha() case-insensitively', `a { filter: Alpha(opacity=50); }`, 'alpha()'],
	['behavior .htc', `a { behavior: url(/assets/pie.htc); }`, '.htc'],
	['behavior .htc in a quoted URL', `a { behavior: url('/assets/pie.htc'); }`, '.htc'],
	['behavior .htc case-insensitively', `a { behavior: url(/assets/pie.HTC); }`, '.htc'],
	[
		'expression()',
		`a { width: expression(document.body.clientWidth - 20 + 'px'); }`,
		'expression()',
	],
	[
		'expression() case-insensitively',
		`a { width: Expression(document.body.clientWidth); }`,
		'expression()',
	],
])('detects %s', (_name, css, hack) => {
	const actual = run(css)
	expect(actual.total).toBe(1)
	expect(actual.unique).toEqual({ [hack]: 1 })
})

test('counts multiple declarations with the same hack', () => {
	const actual = run(`
    a {
      filter: alpha(opacity=50);
      behavior: url(/assets/pie.htc);
      filter: alpha(opacity=80);
    }
  `)
	expect(actual.total).toBe(3)
	expect(actual.total_unique).toBe(2)
	expect(actual.unique).toEqual({ 'alpha()': 2, '.htc': 1 })
})

test.each([
	[
		'url() without .htc extension',
		`a { background: url(/assets/image.png); content: url('/fonts/icon.woff2'); }`,
	],
	[
		'gradients without progid',
		`a { background: linear-gradient(red, blue); background: radial-gradient(circle, #fff, #000); }`,
	],
	['custom properties with \\9', `a { --my-color: red\\9; }`],
	['custom properties with \\7', `a { --my-size: 100px\\7; }`],
	[
		'custom properties with progid:',
		`a { --filter: progid:DXImageTransform.Microsoft.gradient(); }`,
	],
	['custom properties with alpha()', `a { --opacity: alpha(opacity=50); }`],
	['custom properties with expression()', `a { --width: expression(document.body.clientWidth); }`],
	['custom properties with a .htc url', `a { --behavior: url(/assets/pie.htc); }`],
	['aspect-ratio with a slash', `a { aspect-ratio: 16/7; }`],
	['an identifier ending in 7', `a { grid-area: col7; }`],
])('no false positive: %s', (_name, css) => {
	expect(run(css).total).toBe(0)
})

test('global keywords and custom properties are not searched for hacks', () => {
	expect(run('a { color: inherit; --x: green\\9 }').total).toBe(0)
})

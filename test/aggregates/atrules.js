const test = require('ava')
const analyze = require('../../')

test('it analyzes @charset', (t) => {
	const fixture = `
		@charset 'UTF-16';
		@charset 'utf-8';
		@charset 'utf-8';
		@charset "utf-8";
	`
	const actual = analyze(fixture)

	t.is(actual['atrules.charset.total'].value, 4)
	t.is(actual['atrules.charset.totalUnique'].value, 3)
	t.deepEqual(actual['atrules.charset.unique'].value, [
		{
			count: 1,
			value: `'UTF-16'`,
		},
		{
			count: 2,
			value: `'utf-8'`,
		},
		{
			count: 1,
			value: `"utf-8"`,
		},
	])
})

test('it analyzes @font-face', (t) => {
	const fixture = `
		@font-face {
			font-family: 'A';
			src: url(my-url);
		}

		@font-face {
			font-family: "Arial";
			src: url("http://path.to/arial.woff");
		}

		@font-face {
			font-display: swap;
			font-family: monospace;
			font-stretch: condensed;
			font-style: italic;
			font-weight: bold;
			font-variant: no-common-ligatures proportional-nums;
			font-feature-settings: "liga" 0;
			font-variation-settings: "xhgt" 0.7;
			src: local("Input Mono");
			unicode-range: U+0025-00FF;
		}
	`
	const actual = analyze(fixture)

	// t.is(actual['atrules.fontface.total'].value, 4)
	// t.is(actual['atrules.fontface.totalUnique'].value, 3)
	t.deepEqual(actual['atrules.fontface.unique'].value, [
		{
			count: 1,
			value: {
				declarations: [
					{
						property: 'font-family',
						value: `'A'`,
					},
					{
						property: 'src',
						value: 'url(my-url)',
					},
				],
			},
		},
		{
			count: 1,
			value: {
				declarations: [
					{
						property: 'font-family',
						value: `"Arial"`,
					},
					{
						property: 'src',
						value: `url("http://path.to/arial.woff")`,
					},
				],
			},
		},
		{
			count: 1,
			value: {
				declarations: [
					{ property: 'font-display', value: `swap` },
					{ property: 'font-family', value: `monospace` },
					{ property: 'font-stretch', value: `condensed` },
					{ property: 'font-style', value: `italic` },
					{ property: 'font-weight', value: `bold` },
					{
						property: 'font-variant',
						value: `no-common-ligatures proportional-nums`,
					},
					{ property: 'font-feature-settings', value: `"liga" 0` },
					{ property: 'font-variation-settings', value: `"xhgt" 0.7` },
					{ property: 'src', value: `local("Input Mono")` },
					{ property: 'unicode-range', value: `U+0025-00FF` },
				],
			},
		},
	])
})

test.todo('it analyzes @imports')
test.todo('it analyzes @keyframes')
test.todo('it analyzes @keyframes with vendor prefixes')
test.todo('it analyzes @media')
test.todo('it analyzes @media with browserhacks')
test.todo('it analyzes @page')
test.todo('it analyzes @supports')
test.todo('it analyzes @supports with browserhacks')

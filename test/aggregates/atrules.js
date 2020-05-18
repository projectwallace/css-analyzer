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
		{ count: 1, value: `'UTF-16'` },
		{ count: 2, value: `'utf-8'` },
		{ count: 1, value: `"utf-8"` },
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

	t.is(actual['atrules.fontface.total'].value, 3)
	t.is(actual['atrules.fontface.totalUnique'].value, 3)
	t.deepEqual(actual['atrules.fontface.unique'].value, [
		{
			count: 1,
			value: {
				declarations: [
					{ property: 'font-family', value: `'A'` },
					{ property: 'src', value: 'url(my-url)' },
				],
			},
		},
		{
			count: 1,
			value: {
				declarations: [
					{ property: 'font-family', value: `"Arial"` },
					{ property: 'src', value: `url("http://path.to/arial.woff")` },
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

test('it analyzes @imports', (t) => {
	// Examples from MDN
	// https://developer.mozilla.org/en-US/docs/Web/CSS/@import
	const fixture = `
		@import url("fineprint.css") print;
		@import url("bluish.css") speech;
		@import 'custom.css';
		@import url("chrome://communicator/skin/");
		@import "common.css" screen;
		@import url('landscape.css') screen and (orientation:landscape);
	`
	const actual = analyze(fixture)

	t.is(actual['atrules.import.total'].value, 6)
	t.is(actual['atrules.import.totalUnique'].value, 6)
	t.deepEqual(actual['atrules.import.unique'].value, [
		{ count: 1, value: `url("fineprint.css") print` },
		{ count: 1, value: `url("bluish.css") speech` },
		{ count: 1, value: `'custom.css'` },
		{ count: 1, value: `url("chrome://communicator/skin/")` },
		{ count: 1, value: `"common.css" screen` },
		{
			count: 1,
			value: `url('landscape.css') screen and (orientation:landscape)`,
		},
	])
})

test('it analyzes @keyframes', (t) => {
	// Examples from MDN
	// https://developer.mozilla.org/en-US/docs/Web/CSS/@keyframes
	const fixture = `
		@keyframes slidein {
			from {
				transform: translateX(0%);
			}

			to {
				transform: translateX(100%);
			}
		}

		@keyframes identifier {
			0% { top: 0; left: 0; }
			30% { top: 50px; }
			68%, 72% { left: 50px; }
			100% { top: 100px; left: 100%; }
		}
	`
	const actual = analyze(fixture)

	t.is(actual['atrules.keyframes.total'].value, 2)
	t.is(actual['atrules.keyframes.totalUnique'].value, 2)
	t.deepEqual(actual['atrules.keyframes.unique'].value, [
		{ count: 1, value: 'slidein' },
		{ count: 1, value: 'identifier' },
	])
})

test('it analyzes @keyframes with vendor prefixes', (t) => {
	const fixture = `
		@keyframes test {}
		@-ms-keyframes test {}
		@-webkit-keyframes test {}
		@-moz-keyframes test {}
		@-o-keyframes test {}
	`
	const actual = analyze(fixture)

	t.is(actual['atrules.keyframes.prefixed.total'].value, 4)
	t.is(actual['atrules.keyframes.prefixed.totalUnique'].value, 4)
	t.deepEqual(actual['atrules.keyframes.prefixed.unique'].value, [
		{ count: 1, value: `@-ms-keyframes test` },
		{ count: 1, value: `@-webkit-keyframes test` },
		{ count: 1, value: `@-moz-keyframes test` },
		{ count: 1, value: `@-o-keyframes test` },
	])
})

test('it analyzes @media', (t) => {
	const fixture = `
		@media screen {}
		@media url("some-file-in-mq.css") {}
		@media screen and (min-width: 33em) {}
		@media (min-width: 20px) {}
		@media (max-width: 200px) {}
		@media screen or print {}
		@media print {}
		@media screen and (-moz-images-in-menus:0) {}
	`
	const actual = analyze(fixture)

	t.is(actual['atrules.media.total'].value, 8)
	t.is(actual['atrules.media.totalUnique'].value, 8)
	t.deepEqual(actual['atrules.media.unique'].value, [
		{ count: 1, value: `screen` },
		{ count: 1, value: `url("some-file-in-mq.css")` },
		{ count: 1, value: `screen and (min-width: 33em)` },
		{ count: 1, value: `(min-width: 20px)` },
		{ count: 1, value: `(max-width: 200px)` },
		{ count: 1, value: `screen or print` },
		{ count: 1, value: `print` },
		{ count: 1, value: `screen and (-moz-images-in-menus:0)` },
	])
})

test('it analyzes @media with browserhacks', (t) => {
	const fixture = `
		@media print {}
		@media screen and (-moz-images-in-menus:0) {}
	`
	const actual = analyze(fixture)

	t.is(actual['atrules.media.browserhacks.total'].value, 1)
	t.is(actual['atrules.media.browserhacks.totalUnique'].value, 1)
	t.deepEqual(actual['atrules.media.browserhacks.unique'].value, [
		{ count: 1, value: `screen and (-moz-images-in-menus:0)` },
	])
})

test('it analyzes @supports', (t) => {
	const fixture = `
		@supports (filter: blur(5px)) {}
		@supports (display: table-cell) and (display: list-item) {}
		@supports (-webkit-appearance:none) {}
	`
	const actual = analyze(fixture)

	t.is(actual['atrules.supports.total'].value, 3)
	t.is(actual['atrules.supports.totalUnique'].value, 3)
	t.deepEqual(actual['atrules.supports.unique'].value, [
		{ count: 1, value: `(filter: blur(5px))` },
		{ count: 1, value: `(display: table-cell) and (display: list-item)` },
		{ count: 1, value: `(-webkit-appearance:none)` },
	])
})

test('it analyzes @supports with browserhacks', (t) => {
	const fixture = `
		@supports (display: table-cell) and (display: list-item) {}
		@supports (-webkit-appearance:none) {}
		@supports (-moz-appearance:meterbar) and (background-attachment:local) {}
	`
	const actual = analyze(fixture)

	t.is(actual['atrules.supports.browserhacks.total'].value, 2)
	t.is(actual['atrules.supports.browserhacks.totalUnique'].value, 2)
	t.deepEqual(actual['atrules.supports.browserhacks.unique'].value, [
		{ count: 1, value: `(-webkit-appearance:none)` },
		{
			count: 1,
			value: `(-moz-appearance:meterbar) and (background-attachment:local)`,
		},
	])
})

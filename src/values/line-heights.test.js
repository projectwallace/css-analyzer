import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { analyze } from '../index.js'

const LineHeights = suite('LineHeights')

LineHeights('recognizes line-height', () => {
	const fixture = `
    test {
      line-height: 1;
			line-height: 100%;
			line-height: calc(1em + 2vh);
			line-height: 2em;
			line-height: normal;

      /* Unrelated */
      color: brown;
      font-size: 12px;
    }
  `
	const actual = analyze(fixture).values.lineHeights
	const expected = {
		total: 5,
		totalUnique: 5,
		unique: {
			'1': 1,
			'100%': 1,
			'calc(1em + 2vh)': 1,
			'2em': 1,
			'normal': 1,
		},
		uniquenessRatio: 5 / 5
	}

	assert.equal(actual, expected)
})

LineHeights('extracts the `font` shorthand', () => {
	const fixture = `
    test {
      font: large 'Noto Sans';
      font: normal normal 1em/1 "Source Sans Pro", serif;
      font: normal normal 1.2em serif;
      font: 400 1.3em/1 serif;
      font: 1em / 1 serif;
      font: 1em/ 1 serif;
      font: 1em /1 serif;
      font: normal normal 11px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
      font: 11px Consolas, "Liberation Mono", Menlo, Courier, monospace;
      font: 0/0 a; /* As generated by some css minifiers */

      /* Unrelated */
      color: brown;
      font-size: 12px;
    }
  `
	const actual = analyze(fixture).values.lineHeights
	const expected = {
		total: 7,
		totalUnique: 3,
		unique: {
			'1': 5,
			'1.5': 1,
			'0': 1,
		},
		uniquenessRatio: 3 / 7
	}
	assert.equal(actual, expected)
})

LineHeights('handles system fonts', () => {
	// Source: https://drafts.csswg.org/css-fonts-3/#font-prop
	const fixture = `
    test {
      font: menu;        /* use the font settings for system menus */
      font: large menu;  /* use a font family named "menu" */
    }
  `
	const actual = analyze(fixture).values.lineHeights
	const expected = {
		total: 0,
		totalUnique: 0,
		unique: {},
		uniquenessRatio: 0
	}

	assert.equal(actual, expected)
})

LineHeights('ignores keywords and global values', () => {
	const fixture = `
		test {
			/* Global values */
			line-height: inherit;
			line-height: initial;
			line-height: revert;
			line-height: revert-layer;
			line-height: unset;
		}
	`
	const actual = analyze(fixture).values.fontFamilies
	const expected = {
		total: 0,
		totalUnique: 0,
		unique: {},
		uniquenessRatio: 0
	}

	assert.equal(actual, expected)
})

LineHeights.run()
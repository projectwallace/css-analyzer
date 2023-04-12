import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { analyze } from '../index.js'

const FontFamilies = suite('FontFamilies')

FontFamilies('recognizes a font-family', () => {
  const fixture = `
    test {
      font-family: "Droid Sans", serif;
      font-family: sans-serif;
      font-family: "Arial Black", 'Arial Bold', Gadget, sans-serif;
      font-family: Brush Script MT, cursive;
      font-family: monospace;
      font-family: Consolas, "Liberation Mono", Menlo, Courier, monospace;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";

      /* Unrelated */
      color: brown;
      font-size: 12px;
    }
  `
  const actual = analyze(fixture).values.fontFamilies
  const expected = {
    total: 7,
    totalUnique: 7,
    unique: {
      '"Droid Sans", serif': 1,
      'sans-serif': 1,
      [`"Arial Black", 'Arial Bold', Gadget, sans-serif`]: 1,
      'Brush Script MT, cursive': 1,
      'monospace': 1,
      'Consolas, "Liberation Mono", Menlo, Courier, monospace': 1,
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"': 1,
    },
    uniquenessRatio: 7 / 7
  }

  assert.equal(actual, expected)
})

FontFamilies('extracts the `font` shorthand', () => {
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
  const actual = analyze(fixture).values.fontFamilies
  const expected = {
    total: 10,
    totalUnique: 6,
    unique: {
      [`'Noto Sans'`]: 1,
      '"Source Sans Pro", serif': 1,
      'serif': 5,
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"': 1,
      'Consolas, "Liberation Mono", Menlo, Courier, monospace': 1,
      'a': 1,
    },
    uniquenessRatio: 6 / 10
  }
  assert.equal(actual, expected)
})

FontFamilies('handles system fonts', () => {
  // Source: https://drafts.csswg.org/css-fonts-3/#font-prop
  const fixture = `
    test {
      font: menu;        /* use the font settings for system menus */
      font: large menu;  /* use a font family named "menu" */
    }
  `
  const actual = analyze(fixture).values.fontFamilies
  const expected = {
    total: 1,
    totalUnique: 1,
    unique: {
      'menu': 1
    },
    uniquenessRatio: 1 / 1
  }

  assert.equal(actual, expected)
})

FontFamilies('ignores keywords and global values', () => {
  const fixture = `
    test {
      /* Global values */
      font-size: inherit;
      font-size: initial;
      font-size: revert;
      font-size: revert-layer;
      font-size: unset;
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

FontFamilies.run()
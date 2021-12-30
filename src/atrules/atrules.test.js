import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { analyze } from '../index.js'

const AtRules = suite('at-rules')

AtRules('finds @font-face', () => {
  const fixture = `
    @font-face {
      font-family: Arial;
      src: url("https://url-to-arial.woff");
    }

    @font-face {
      font-display: swap;
      font-family: Test;
      font-stretch: condensed;
      font-style: italic;
      font-weight: 700;
      font-variant: no-common-ligatures proportional-nums;
      font-feature-settings: "liga" 0;
      font-variation-settings: "xhgt" 0.7;
      src: local("Input Mono");
      unicode-range: U+0025-00FF;
    }

    @font-face {
      font-family: 'Input Mono';
      src: local('Input Mono') url("https://url-to-input-mono.woff");
    }

    @font-face {
      font-family: MyHelvetica;
      src: local("Helvetica Neue Bold"), local("HelveticaNeue-Bold"), url(MgOpenModernaBold.ttf);
      font-weight: bold;
    }

    /* Duplicate @font-face in Media Query */
    @media (min-width: 1000px) {
      @font-face {
        font-family: 'Input Mono';
        src: local('Input Mono') url("https://url-to-input-mono.woff");
      }
    }`
  const actual = analyze(fixture).atrules.fontface
  const expected = {
    total: 5,
    totalUnique: 5,
    unique: [
      {
        "font-family": "Arial",
        "src": "url(\"https://url-to-arial.woff\")"
      },
      {
        "font-display": `swap`,
        "font-family": `Test`,
        "font-stretch": `condensed`,
        "font-style": `italic`,
        "font-weight": `700`,
        "font-variant": `no-common-ligatures proportional-nums`,
        "font-feature-settings": `"liga" 0`,
        "font-variation-settings": `"xhgt" 0.7`,
        "src": `local("Input Mono")`,
        "unicode-range": `U+0025-00FF`,
      },
      {
        "font-family": "'Input Mono'",
        "src": "local('Input Mono') url(\"https://url-to-input-mono.woff\")"
      },
      {
        'font-family': 'MyHelvetica',
        'src': 'local("Helvetica Neue Bold"), local("HelveticaNeue-Bold"), url(MgOpenModernaBold.ttf)',
        'font-weight': 'bold',
      },
      {
        "font-family": "'Input Mono'",
        "src": "local('Input Mono') url(\"https://url-to-input-mono.woff\")"
      }
    ],
    uniquenessRatio: 1
  }

  assert.equal(actual, expected)
})

AtRules('finds @imports', () => {
  const fixture = `
    @import "https://example.com/without-url";
    @import url("https://example.com/with-url");
    @import url("https://example.com/with-media-query") screen and (min-width: 33em);
    @import url("https://example.com/with-multiple-media-queries") screen, projection;
  `
  const actual = analyze(fixture).atrules.import
  const expected = {
    total: 4,
    totalUnique: 4,
    unique: {
      '"https://example.com/without-url"': 1,
      'url("https://example.com/with-url")': 1,
      'url("https://example.com/with-media-query") screen and (min-width: 33em)': 1,
      'url("https://example.com/with-multiple-media-queries") screen, projection': 1,
    },
    uniquenessRatio: 4 / 4
  }

  assert.equal(actual, expected)
})

AtRules('finds @charsets', () => {
  const fixture = `
    @charset "UTF-8";
    @charset "UTF-16";
  `
  const actual = analyze(fixture).atrules.charset
  const expected = {
    total: 2,
    totalUnique: 2,
    unique: {
      '"UTF-8"': 1,
      '"UTF-16"': 1,
    },
    uniquenessRatio: 2 / 2
  }

  assert.equal(actual, expected)
})

AtRules('finds @supports', () => {
  const fixture = `
    @supports (filter: blur(5px)) {}
    @supports (display: table-cell) and (display: list-item) {}
    @supports (-webkit-appearance: none) {}

    @media (min-width: 0) {
      @supports (-webkit-appearance: none) {}
    }
  `
  const actual = analyze(fixture).atrules.supports
  const expected = {
    total: 4,
    totalUnique: 3,
    unique: {
      '(filter: blur(5px))': 1,
      '(display: table-cell) and (display: list-item)': 1,
      '(-webkit-appearance: none)': 2,
    },
    uniquenessRatio: 3 / 4
  }

  assert.equal(actual, expected)
})

AtRules('finds @media', () => {
  const fixture = `
    @media screen {}
    @media screen and (min-width: 33em) {}
    @media (min-width: 20px) {}
    @media (max-width: 200px) {}
    @media screen or print {}
    @media \\0 all {}

    @supports (-webkit-appearance: none) {
      @media (min-width: 0) {}
    }
  `
  const actual = analyze(fixture).atrules.media
  const expected = {
    total: 7,
    totalUnique: 7,
    unique: {
      'screen': 1,
      'screen and (min-width: 33em)': 1,
      '(min-width: 20px)': 1,
      '(max-width: 200px)': 1,
      'screen or print': 1,
      '\\0 all': 1,
      '(min-width: 0)': 1,
    },
    uniquenessRatio: 7 / 7
  }

  assert.equal(actual, expected)
})

AtRules('analyzes @keyframes', () => {
  const fixture = `
    @keyframes one {}
    @keyframes one {}
    @keyframes TWO {}

    /* Prefixes */
    @-webkit-keyframes animation {}
    @-moz-keyframes animation {}
    @-o-keyframes animation {}
  `
  const actual = analyze(fixture).atrules.keyframes
  const expected = {
    total: 6,
    totalUnique: 5,
    unique: {
      '@keyframes one': 2,
      '@keyframes TWO': 1,
      '@-webkit-keyframes animation': 1,
      '@-moz-keyframes animation': 1,
      '@-o-keyframes animation': 1,
    },
    uniquenessRatio: 5 / 6,
    prefixed: {
      total: 3,
      totalUnique: 3,
      unique: {
        '@-webkit-keyframes animation': 1,
        '@-moz-keyframes animation': 1,
        '@-o-keyframes animation': 1,
      },
      uniquenessRatio: 3 / 3,
      ratio: 3 / 6
    }
  }

  assert.equal(actual, expected)
})

AtRules('analyzes container queries', () => {
  // Fixture contains examples from the spec.
  // https://drafts.csswg.org/css-contain-3/
  const fixture = `
    /* Example 2 */
    @container (inline-size > 45em) {
      .media-object {
        grid-template: 'img content' auto / auto 1fr;
      }
    }

    /* Example 3 */
    @container (width > 40em) {
      h2 { font-size: 1.5em; }
    }

    /* Example 4 */
    @container (--cards) {
      article {
        border: thin solid silver;
        border-radius: 0.5em;
        padding: 1em;
      }
    }

    /* Example 5 */
    @container page-layout (block-size > 12em) {
      .card { margin-block: 2em; }
    }

    @container component-library (inline-size > 30em) {
      .card { margin-inline: 2em; }
    }

    /* Example 8 */
    @container card (inline-size > 30em) and (--responsive = true) {
      /* styles */
    }

    /* Example 11 */
    @container type(inline-size) {
      /* only applies when an inline-size container is available */
      h2 { font-size: calc(1.2em + 1cqi); }
    }
  `
  const result = analyze(fixture)
  const actual = result.atrules.container
  const expected = {
    total: 7,
    totalUnique: 7,
    unique: {
      '(inline-size > 45em)': 1,
      '(width > 40em)': 1,
      '(--cards)': 1,
      'page-layout (block-size > 12em)': 1,
      'component-library (inline-size > 30em)': 1,
      'card (inline-size > 30em) and (--responsive = true)': 1,
      'type(inline-size)': 1,
    },
    uniquenessRatio: 7 / 7
  }

  assert.equal(actual, expected)
})

AtRules.run()
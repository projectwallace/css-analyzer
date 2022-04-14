import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { analyze } from '../index.js'

const AtRules = suite('at-rules')

AtRules('finds @layer', () => {
  // Fixture is pretty much a straight copy from all code examples from
  // https://css-tricks.com/css-cascade-layers/
  const fixture = `
    /* establish a layer order up-front, from lowest to highest priority */
    @layer reset, defaults, patterns, components, utilities, overrides;

    /* add styles to layers */
    @layer utilities {
      /* high layer priority, despite low specificity */
      [data-color='brand'] {
        color: var(--brand, rebeccapurple);
      }
    }

    @layer defaults {
      /* higher specificity, but lower layer priority */
      a:any-link { color: maroon; }
    }

    /* un-layered styles have the highest priority */
    a {
      color: mediumvioletred;
    }

    @layer layer-1 { a { color: red; } }
    @layer layer-2 { a { color: orange; } }
    @layer layer-3 {
      @layer sub-layer-1 { a { color: yellow; } }
      @layer sub-layer-2 { a { color: green; } }
      /* un-nested */ a { color: blue; }
    }
    /* un-layered */ a { color: indigo; }

    @layer reset, defaults, framework;
    @layer components, defaults, framework, reset, utilities;

    @layer one {
      /* sorting the sub-layers */
      @layer two, three;

      /* styles ... */
      @layer three { /* styles ... */ }
      @layer two { /* styles ... */ }
    }

    /* sorting nested layers directly */
    @layer one.two, one.three;

    /* adding to nested layers directly */
    @layer one.three { /* ... */ }
    @layer one.two { /* ... */ }

    @layer reset.type, default.type, reset.media, default.media;

    @layer
      reset,
      default,
      themes,
      patterns,
      layouts,
      components,
      utilities;

    @layer components {
      @layer defaults, structures, themes, utilities;
    }
  `
  const actual = analyze(fixture).atrules.layer
  const expected = {
    total: 46,
    totalUnique: 25,
    unique: {
      "defaults": 5,
      "layer-1": 1,
      "layer-2": 1,
      "layer-3": 1,
      "sub-layer-1": 1,
      "sub-layer-2": 1,
      "reset": 4,
      "framework": 2,
      "components": 4,
      "utilities": 5,
      "one": 1,
      "two": 2,
      "three": 2,
      "one.two": 2,
      "one.three": 2,
      "reset.type": 1,
      "default.type": 1,
      "reset.media": 1,
      "default.media": 1,
      "default": 1,
      "themes": 2,
      "patterns": 2,
      "layouts": 1,
      "structures": 1,
      "overrides": 1,
    },
    uniquenessRatio: 25 / 46
  }

  assert.equal(actual, expected)
})

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

    /* styles imported into to the <layer-name> layer */
    @import url('example.css') layer(named-layer);

    /* styles imported into to a new anonymous layer */
    @import url('../example.css') layer;

    @import url('remedy.css') layer(reset.remedy);
  `
  const actual = analyze(fixture).atrules.import
  const expected = {
    total: 7,
    totalUnique: 7,
    unique: {
      '"https://example.com/without-url"': 1,
      'url("https://example.com/with-url")': 1,
      'url("https://example.com/with-media-query") screen and (min-width: 33em)': 1,
      'url("https://example.com/with-multiple-media-queries") screen, projection': 1,
      'url(\'example.css\') layer(named-layer)': 1,
      'url(\'../example.css\') layer': 1,
      'url(\'remedy.css\') layer(reset.remedy)': 1,
    },
    uniquenessRatio: 1,
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

AtRules('counts ratio correctly when no @keyframes present', () => {
  const fixture = `@media (min-width: 0px) {}`
  const actual = analyze(fixture)
  const expected = {
    total: 0,
    totalUnique: 0,
    unique: {},
    uniquenessRatio: 0,
    prefixed: {
      total: 0,
      totalUnique: 0,
      unique: {},
      uniquenessRatio: 0,
      ratio: 0,
    },
  }
  assert.equal(actual.atrules.keyframes, expected)
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

AtRules.only('finds @supports browserhacks', () => {
  const fixture = `
    @supports (-webkit-appearance:none) {}
    @supports (-webkit-appearance: none) {}
    @supports (-moz-appearance:meterbar) {}
    @supports (-moz-appearance:meterbar) and (display:flex) {}
    @supports (-moz-appearance:meterbar) and (cursor:zoom-in) {}
    @supports (-moz-appearance:meterbar) and (background-attachment:local) {}
    @supports (-moz-appearance:meterbar) and (image-orientation:90deg) {}
    @supports (-moz-appearance:meterbar) and (all:initial) {}
    @supports (-moz-appearance:meterbar) and (list-style-type:japanese-formal) {}
    @supports (-moz-appearance:meterbar) and (background-blend-mode:difference,normal) {}
  `
  const result = analyze(fixture)
  const actual = result.atrules.supports.browserhacks
  const expected = {
    total: 3,
    totalUnique: 3,
    uniquenessRatio: 1,
    unique: {}
  }

  assert.equal(actual, expected)
})

AtRules('finds browserhacks', () => {
  const fixture = `
    @media screen and (min-width:0\0) {}
    @supports (-webkit-appearance:none) {}
    @media \\0 screen {}
    @media all and (-webkit-min-device-pixel-ratio:0) and (min-resolution: .001dpcm) { .selector {} }
    @media \0 all {}
    @media screen and (-moz-images-in-menus:0) {}
    @media screen and (min--moz-device-pixel-ratio:0) {}
    @media all and (min--moz-device-pixel-ratio:0) and (min-resolution: .001dpcm) {}
    @media all and (-moz-images-in-menus:0) and (min-resolution: .001dpcm) {}
    @media all and (min--moz-device-pixel-ratio:0) { @media (min-width: 0px) {} }
    @media all and (-moz-images-in-menus:0) { @media (min-width: 0px) {} }
    @supports (-moz-appearance:meterbar) {}
    @supports (-moz-appearance:meterbar) and (display:flex) {}
    @supports (-moz-appearance:meterbar) and (cursor:zoom-in) {}
    @supports (-moz-appearance:meterbar) and (background-attachment:local) {}
    @supports (-moz-appearance:meterbar) and (image-orientation:90deg) {}
    @supports (-moz-appearance:meterbar) and (all:initial) {}
    @supports (-moz-appearance:meterbar) and (list-style-type:japanese-formal) {}
    @media all and (min--moz-device-pixel-ratio:0) and (min-resolution: 3e1dpcm) {}
    @supports (-moz-appearance:meterbar) and (background-blend-mode:difference,normal) {}
    @-moz-document url-prefix() {}
    @media screen\9 {}
    @media \0screen\,screen\9 {}
    @media \0screen {}
    @media screen and (min-width:0\0) {}
    @media screen and (-ms-high-contrast: active), (-ms-high-contrast: none) {}
    @media screen { @media (min-width: 0px) {} }
    @media all and (-webkit-min-device-pixel-ratio:10000), not all and (-webkit-min-device-pixel-ratio:0) {}
    @media (min-resolution: .001dpcm) { _:-o-prefocus, .selector {} }
    @media all and (-webkit-min-device-pixel-ratio:0) and (min-resolution: .001dpcm) { .selector {} }
    @media screen and (min-width:0\0) {}
    @media screen { @media (min-width: 0px) {} }
    @media \\0 screen {}
  `
  const result = analyze(fixture)
  const actual = result.atrules
  const expected = {
    total: 3,
    totalUnique: 3,
    uniquenessRatio: 1,
    unique: {}
  }

  assert.equal(actual, expected)
})

AtRules.run()
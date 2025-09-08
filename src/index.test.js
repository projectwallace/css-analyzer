import { suite } from "uvu"
import * as assert from "uvu/assert"
import {
  analyze,
  compareSpecificity,
  selectorComplexity,
  isAccessibilitySelector,
  isSelectorPrefixed,
  isMediaBrowserhack,
  isSupportsBrowserhack,
  isPropertyHack,
  isValuePrefixed,
  hasVendorPrefix,
  cssKeywords,
  // Color exports
  namedColors,
  systemColors,
  colorFunctions,
  colorKeywords,
} from "./index.js"

const Api = suite("Public API")

Api("exposes the 'analyze' method", () => {
  assert.is(typeof analyze, "function")
})

Api('exposes the "compareSpecificity" method', () => {
  assert.is(typeof compareSpecificity, "function")
})

Api('exposes the "selectorComplexity" method', () => {
  assert.is(typeof selectorComplexity, "function")
})

Api('exposes the "isSelectorPrefixed" method', () => {
  assert.is(typeof isSelectorPrefixed, "function")
})

Api('exposes the "isAccessibilitySelector" method', () => {
  assert.is(typeof isAccessibilitySelector, "function")
})

Api('exposes the "isMediaBrowserhack" method', () => {
  assert.is(typeof isMediaBrowserhack, "function")
})

Api('exposes the "isSupportsBrowserhack" method', () => {
  assert.is(typeof isSupportsBrowserhack, "function")
})

Api('exposes the "isPropertyHack" method', () => {
  assert.is(typeof isPropertyHack, "function")
})

Api('exposes the "isValuePrefixed" method', () => {
  assert.is(typeof isValuePrefixed, "function")
})

Api('exposes the "hasVendorPrefix" method', () => {
  assert.is(typeof hasVendorPrefix, "function")
})

Api('exposes the namedColors KeywordSet', () => {
  assert.ok(namedColors.has('Red'))
})

Api('exposes the systemColors KeywordSet', () => {
  assert.ok(systemColors.has('LinkText'))
})

Api('exposes the colorFunctions KeywordSet', () => {
  assert.ok(colorFunctions.has('okLAB'))
})

Api('exposes the colorKeywords KeywordSet', () => {
  assert.ok(colorKeywords.has('TRANSPARENT'))
})

Api('exposes CSS keywords KeywordSet', () => {
  assert.ok(cssKeywords.has('Auto'))
  assert.ok(cssKeywords.has('inherit'))
})

Api("does not break on CSS Syntax Errors", () => {
  assert.not.throws(() => analyze("test, {}"))
  assert.not.throws(() => analyze("test { color red }"))
})

Api("handles empty input gracefully", () => {
  const actual = analyze("")
  delete actual.__meta__
  const expected = {
    stylesheet: {
      sourceLinesOfCode: 0,
      linesOfCode: 1,
      size: 0,
      comments: {
        total: 0,
        size: 0,
      },
      embeddedContent: {
        size: {
          total: 0,
          ratio: 0,
        },
        types: {
          total: 0,
          totalUnique: 0,
          uniquenessRatio: 0,
          unique: {},
        },
      },
      complexity: 0,
    },
    atrules: {
      total: 0,
      totalUnique: 0,
      unique: {},
      uniquenessRatio: 0,
      fontface: {
        total: 0,
        totalUnique: 0,
        unique: [],
        uniquenessRatio: 0,
      },
      import: {
        total: 0,
        totalUnique: 0,
        unique: {},
        uniquenessRatio: 0,
      },
      media: {
        total: 0,
        totalUnique: 0,
        unique: {},
        uniquenessRatio: 0,
        browserhacks: {
          total: 0,
          totalUnique: 0,
          unique: {},
          uniquenessRatio: 0,
        },
        features: {
          total: 0,
          totalUnique: 0,
          unique: {},
          uniquenessRatio: 0,
        },
      },
      charset: {
        total: 0,
        totalUnique: 0,
        unique: {},
        uniquenessRatio: 0,
      },
      supports: {
        total: 0,
        totalUnique: 0,
        unique: {},
        uniquenessRatio: 0,
        browserhacks: {
          total: 0,
          totalUnique: 0,
          unique: {},
          uniquenessRatio: 0,
        },
      },
      keyframes: {
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
      },
      container: {
        total: 0,
        totalUnique: 0,
        unique: {},
        uniquenessRatio: 0,
        names: {
          total: 0,
          totalUnique: 0,
          unique: {},
          uniquenessRatio: 0,
        },
      },
      layer: {
        total: 0,
        totalUnique: 0,
        unique: {},
        uniquenessRatio: 0,
      },
      property: {
        total: 0,
        totalUnique: 0,
        unique: {},
        uniquenessRatio: 0,
      },
      complexity: {
        min: 0,
        max: 0,
        mean: 0,
        mode: 0,
        range: 0,
        sum: 0,
      },
      nesting: {
        min: 0,
        max: 0,
        mean: 0,
        mode: 0,
        range: 0,
        sum: 0,
        items: [],
        total: 0,
        totalUnique: 0,
        unique: {},
        uniquenessRatio: 0,
      }
    },
    rules: {
      total: 0,
      empty: {
        total: 0,
        ratio: 0,
      },
      sizes: {
        min: 0,
        max: 0,
        mean: 0,
        mode: 0,
        range: 0,
        sum: 0,
        items: [],
        unique: {},
        total: 0,
        totalUnique: 0,
        uniquenessRatio: 0,
      },
      nesting: {
        min: 0,
        max: 0,
        mean: 0,
        mode: 0,
        range: 0,
        sum: 0,
        items: [],
        total: 0,
        totalUnique: 0,
        unique: {},
        uniquenessRatio: 0,
      },
      selectors: {
        min: 0,
        max: 0,
        mean: 0,
        mode: 0,
        range: 0,
        sum: 0,
        items: [],
        unique: {},
        total: 0,
        totalUnique: 0,
        uniquenessRatio: 0,
      },
      declarations: {
        min: 0,
        max: 0,
        mean: 0,
        mode: 0,
        range: 0,
        sum: 0,
        items: [],
        unique: {},
        total: 0,
        totalUnique: 0,
        uniquenessRatio: 0,
      },
    },
    selectors: {
      total: 0,
      totalUnique: 0,
      uniquenessRatio: 0,
      specificity: {
        min: [0, 0, 0],
        max: [0, 0, 0],
        sum: [0, 0, 0],
        mean: [0, 0, 0],
        mode: [0, 0, 0],
        items: [],
        unique: {},
        total: 0,
        totalUnique: 0,
        uniquenessRatio: 0,
      },
      complexity: {
        min: 0,
        max: 0,
        mean: 0,
        mode: 0,
        range: 0,
        sum: 0,
        total: 0,
        totalUnique: 0,
        unique: {},
        uniquenessRatio: 0,
        items: [],
      },
      nesting: {
        min: 0,
        max: 0,
        mean: 0,
        mode: 0,
        range: 0,
        sum: 0,
        items: [],
        total: 0,
        totalUnique: 0,
        unique: {},
        uniquenessRatio: 0,
      },
      id: {
        total: 0,
        totalUnique: 0,
        unique: {},
        uniquenessRatio: 0,
        ratio: 0,
      },
      pseudoClasses: {
        total: 0,
        totalUnique: 0,
        unique: {},
        uniquenessRatio: 0,
      },
      accessibility: {
        total: 0,
        totalUnique: 0,
        unique: {},
        uniquenessRatio: 0,
        ratio: 0,
      },
      keyframes: {
        total: 0,
        totalUnique: 0,
        unique: {},
        uniquenessRatio: 0,
      },
      prefixed: {
        total: 0,
        totalUnique: 0,
        unique: {},
        uniquenessRatio: 0,
        ratio: 0,
      },
      combinators: {
        total: 0,
        totalUnique: 0,
        unique: {},
        uniquenessRatio: 0,
      },
    },
    declarations: {
      total: 0,
      totalUnique: 0,
      uniquenessRatio: 0,
      importants: {
        total: 0,
        ratio: 0,
        inKeyframes: {
          total: 0,
          ratio: 0,
        },
      },
      complexity: {
        min: 0,
        max: 0,
        mean: 0,
        mode: 0,
        range: 0,
        sum: 0,
      },
      nesting: {
        min: 0,
        max: 0,
        mean: 0,
        mode: 0,
        range: 0,
        sum: 0,
        items: [],
        total: 0,
        totalUnique: 0,
        unique: {},
        uniquenessRatio: 0,
      }
    },
    properties: {
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
      custom: {
        total: 0,
        totalUnique: 0,
        unique: {},
        uniquenessRatio: 0,
        ratio: 0,
        importants: {
          total: 0,
          totalUnique: 0,
          unique: {},
          uniquenessRatio: 0,
          ratio: 0,
        },
      },
      browserhacks: {
        total: 0,
        totalUnique: 0,
        unique: {},
        uniquenessRatio: 0,
        ratio: 0,
      },
      complexity: {
        min: 0,
        max: 0,
        mean: 0,
        mode: 0,
        range: 0,
        sum: 0,
      },
    },
    values: {
      colors: {
        total: 0,
        totalUnique: 0,
        unique: {},
        uniquenessRatio: 0,
        itemsPerContext: {},
        formats: {
          total: 0,
          totalUnique: 0,
          unique: {},
          uniquenessRatio: 0,
        },
      },
      gradients: {
        total: 0,
        totalUnique: 0,
        unique: {},
        uniquenessRatio: 0,
      },
      fontFamilies: {
        total: 0,
        totalUnique: 0,
        unique: {},
        uniquenessRatio: 0,
      },
      fontSizes: {
        total: 0,
        totalUnique: 0,
        unique: {},
        uniquenessRatio: 0,
      },
      lineHeights: {
        total: 0,
        totalUnique: 0,
        unique: {},
        uniquenessRatio: 0,
      },
      zindexes: {
        total: 0,
        totalUnique: 0,
        unique: {},
        uniquenessRatio: 0,
      },
      textShadows: {
        total: 0,
        totalUnique: 0,
        unique: {},
        uniquenessRatio: 0,
      },
      boxShadows: {
        total: 0,
        totalUnique: 0,
        unique: {},
        uniquenessRatio: 0,
      },
      borderRadiuses: {
        total: 0,
        totalUnique: 0,
        unique: {},
        itemsPerContext: {},
        uniquenessRatio: 0,
      },
      animations: {
        durations: {
          total: 0,
          totalUnique: 0,
          unique: {},
          uniquenessRatio: 0,
        },
        timingFunctions: {
          total: 0,
          totalUnique: 0,
          unique: {},
          uniquenessRatio: 0,
        },
      },
      prefixes: {
        total: 0,
        totalUnique: 0,
        unique: {},
        uniquenessRatio: 0,
      },
      browserhacks: {
        total: 0,
        totalUnique: 0,
        unique: {},
        uniquenessRatio: 0,
      },
      units: {
        total: 0,
        totalUnique: 0,
        unique: {},
        uniquenessRatio: 0,
        itemsPerContext: {},
      },
      complexity: {
        min: 0,
        max: 0,
        mean: 0,
        mode: 0,
        range: 0,
        sum: 0,
      },
      keywords: {
        total: 0,
        totalUnique: 0,
        unique: {},
        uniquenessRatio: 0,
      },
      resets: {
        total: 0,
        totalUnique: 0,
        unique: {},
        uniquenessRatio: 0,
      },
    },
  }

  assert.equal(actual, expected)
})

Api("has metadata", () => {
  const fixture = Array.from({ length: 100 })
    .map(
      (_) => `
    html {
      font: 1em/1 sans-serif;
      color: rgb(0 0 0 / 0.5);
    }

    @media screen {
      @supports (display: grid) {
        test::after :where(test) :is(done) {
          display: grid;
          color: #f00;
        }
      }
    }
  `
    )
    .join("")

  const result = analyze(fixture)
  const actual = result.__meta__

  assert.type(actual.parseTime, "number")
  assert.ok(
    actual.parseTime > 0,
    `expected parseTime to be bigger than 0, got ${actual.parseTime}`
  )

  assert.type(actual.analyzeTime, "number")
  assert.ok(
    actual.analyzeTime > 0,
    `expected analyzeTime to be bigger than 0, got ${actual.parseTime}`
  )

  assert.type(actual.total, "number")
  assert.ok(
    actual.total > 0,
    `expected total time to be bigger than 0, got ${actual.parseTime}`
  )
})

Api.run()

import walk from 'css-tree/walker'
import { startsWith, strEquals } from '../string-utils.js'
import { hasVendorPrefix } from '../vendor-prefix.js'

const COMPLEXITY = 0
const IS_A11Y = 1

/**
 * Compare specificity A to Specificity B
 * @param {[number,number,number]} a - Specificity A
 * @param {[number,number,number]} b - Specificity B
 * @returns {number} sortIndex - 0 when a==b, 1 when a<b, -1 when a>b
 */
function compareSpecificity(a, b) {
  if (a[0] === b[0]) {
    if (a[1] === b[1]) {
      return b[2] - a[2]
    }

    return b[1] - a[1]
  }

  return b[0] - a[0]
}

/**
 *
 * @param {import('css-tree').SelectorList} selectorListAst
 * @returns {Selector} topSpecificitySelector
 */
function analyzeList(selectorListAst) {
  const childSelectors = []
  walk(selectorListAst, {
    visit: 'Selector',
    enter: function (node) {
      childSelectors.push(analyzeSelector(node))
    }
  })

  return childSelectors.sort(compareSpecificity)
}

/**
 * Get the Specificity for the AST of a Selector Node
 * @param {import('css-tree').Selector} ast - AST Node for a Selector
 * @return {[number, number, number, number, number]} - Array with SpecificityA, SpecificityB, SpecificityC, complexity, isA11y
 */
const analyzeSelector = (node) => {
  let complexity = 0
  let isA11y = false

  walk(node, function (selector) {
    if (selector.type == 'Selector' || selector.type == 'Nth') return

    complexity++

    if (selector.type == 'IdSelector'
      || selector.type == 'ClassSelector'
      || selector.type == 'PseudoElementSelector'
      || selector.type == 'TypeSelector'
      || selector.type == 'PseudoClassSelector'
    ) {
      if (hasVendorPrefix(selector.name)) {
        complexity++
      }
    }

    if (selector.type == 'AttributeSelector') {
      if (Boolean(selector.value)) {
        complexity++
      }
      if (strEquals('role', selector.name.name) || startsWith('aria-', selector.name.name)) {
        isA11y = true
      }
      if (hasVendorPrefix(selector.name.name)) {
        complexity++
      }
      return this.skip
    }

    if (selector.type == 'PseudoClassSelector') {
      if (strEquals(selector.name, 'where')
        || strEquals(selector.name, 'is')
        || strEquals(selector.name, 'has')
        || strEquals(selector.name, 'matches')
        || strEquals(selector.name, '-webkit-any')
        || strEquals(selector.name, '-moz-any')
        || strEquals(selector.name, 'not')
        || strEquals(selector.name, 'nth-child')
        || strEquals(selector.name, 'nth-last-child')
      ) {
        const selectorList = analyzeList(selector)

        // Bail out for empty/non-existent :nth-child() params
        if (selectorList.length === 0) return

        for (let i = 0; i < selectorList.length; i++) {
          const listItem = selectorList[i]
          if (listItem[IS_A11Y] === 1) {
            isA11y = true
          }
          complexity += listItem[COMPLEXITY]
        }

        return this.skip
      }
    }
  })

  return [
    complexity,
    isA11y ? 1 : 0,
  ]
}

export {
  analyzeSelector,
  compareSpecificity,
}
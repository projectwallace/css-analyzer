import walk from 'css-tree/walker'
import { startsWith, strEquals } from '../string-utils.js'
import { hasVendorPrefix } from '../vendor-prefix.js'

/**
 * Compare specificity A to Specificity B
 * @param {[number,number,number]} a - Specificity A
 * @param {[number,number,number]} b - Specificity B
 * @returns {number} sortIndex - 0 when a==b, 1 when a<b, -1 when a>b
 */
export function compareSpecificity(a, b) {
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
 * @returns {Selector[]} Analyzed selectors in the selectorList
 */
function analyzeList(selectorListAst, cb) {
  const childSelectors = []
  walk(selectorListAst, {
    visit: 'Selector',
    enter: function (node) {
      childSelectors.push(cb(node))
    }
  })

  return childSelectors
}

function isPseudoFunction(name) {
  return (
    strEquals(name, 'not')
    || strEquals(name, 'nth-child')
    || strEquals(name, 'nth-last-child')
    || strEquals(name, 'where')
    || strEquals(name, 'is')
    || strEquals(name, 'has')
    || strEquals(name, 'matches')
    || strEquals(name, '-webkit-any')
    || strEquals(name, '-moz-any')
  )
}

export function isAccessibility(selector) {
  let isA11y = false

  walk(selector, function (node) {
    if (node.type == 'AttributeSelector') {
      if (strEquals('role', node.name.name) || startsWith('aria-', node.name.name)) {
        isA11y = true
        return this.break
      }
    }
    // Test for [aria-] or [role] inside :is()/:where() and friends
    else if (node.type == 'PseudoClassSelector') {
      if (isPseudoFunction(node.name)) {
        const list = analyzeList(node, isAccessibility)

        if (list.some(b => b == true)) {
          isA11y = true
          return this.skip
        }

        return this.skip
      }
    }
  })

  return isA11y;
}

/**
 * Get the Complexity for the AST of a Selector Node
 * @param {import('css-tree').Selector} ast - AST Node for a Selector
 * @return {number} - The numeric complexity of the Selector
 */
export function getComplexity(selector) {
  let complexity = 0
  let isPrefixed = false

  walk(selector, function (node) {
    if (node.type == 'Selector' || node.type == 'Nth') return

    complexity++

    if (node.type == 'IdSelector'
      || node.type == 'ClassSelector'
      || node.type == 'PseudoElementSelector'
      || node.type == 'TypeSelector'
      || node.type == 'PseudoClassSelector'
    ) {
      if (hasVendorPrefix(node.name)) {
        isPrefixed = true
        complexity++
      }
    }

    if (node.type == 'AttributeSelector') {
      if (Boolean(node.value)) {
        complexity++
      }
      if (hasVendorPrefix(node.name.name)) {
        isPrefixed = true
        complexity++
      }
      return this.skip
    }

    if (node.type == 'PseudoClassSelector') {
      if (isPseudoFunction(node.name)) {
        const list = analyzeList(node, getComplexity)

        // Bail out for empty/non-existent :nth-child() params
        if (list.length === 0) return

        list.forEach(([c, p]) => {
          complexity += c
          if (p == true) isPrefixed = true
        })
        return this.skip
      }
    }
  })

  return [complexity, isPrefixed]
}

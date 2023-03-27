import walk from 'css-tree/walker'
import { startsWith, strEquals } from '../string-utils.js'
import { hasVendorPrefix } from '../vendor-prefix.js'
import {
  is_selector,
  is_nth,
  is_attribute_selector,
  is_id_selector,
  is_class_selector,
  is_pseudo_element_selector,
  is_type_selector,
  is_pseudo_class_selector,
} from '../css-node.js'

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
    let node_type = node.type
    if (is_attribute_selector(node_type)) {
      if (strEquals('role', node.name.name) || startsWith('aria-', node.name.name)) {
        isA11y = true
        return this.break
      }
      return
    }
    // Test for [aria-] or [role] inside :is()/:where() and friends
    if (is_pseudo_class_selector(node_type)) {
      if (isPseudoFunction(node.name)) {
        const list = analyzeList(node, isAccessibility)

        if (list.some(b => b === true)) {
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
 * @param {import('css-tree').Selector} selector - AST Node for a Selector
 * @return {number} - The numeric complexity of the Selector
 */
export function getComplexity(selector) {
  let complexity = 0
  let is_prefixed = false

  walk(selector, function (node) {
    let type = node.type

    if (is_selector(type) || is_nth(type)) return

    complexity++

    if (is_id_selector(type)
      || is_class_selector(type)
      || is_type_selector(type)
      || is_pseudo_element_selector(type)
      || is_pseudo_class_selector(type)
    ) {
      if (hasVendorPrefix(node.name)) {
        complexity++
        is_prefixed = true
      }
    }

    if (is_attribute_selector(type)) {
      if (Boolean(node.value)) {
        complexity++
      }
      if (hasVendorPrefix(node.name.name)) {
        complexity++
        is_prefixed = true
      }
      return this.skip
    }

    if (is_pseudo_class_selector(type)) {
      if (isPseudoFunction(node.name)) {
        const list = analyzeList(node, getComplexity)

        // Bail out for empty/non-existent :nth-child() params
        if (list.length === 0) return

        list.forEach(([comp, is_pref]) => {
          complexity += comp
          if (is_pref) {
            is_prefixed = true
          }
        })
        return this.skip
      }
      return
    }
  })

  return [complexity, is_prefixed]
}

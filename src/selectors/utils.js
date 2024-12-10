// @ts-expect-error CSS Tree types are incomplete
import walk from 'css-tree/walker'
import { startsWith, strEquals } from '../string-utils.js'
import { hasVendorPrefix } from '../vendor-prefix.js'
import { KeywordSet } from '../keyword-set.js'
import {
  PseudoClassSelector,
  PseudoElementSelector,
  TypeSelector,
  Combinator,
  Selector,
  AttributeSelector,
  Nth,
} from '../css-tree-node-types.js'

/**
 *
 * @param {import('css-tree').SelectorList} selectorListAst
 * @returns {Selector[]} Analyzed selectors in the selectorList
 */
function analyzeList(selectorListAst, cb) {
  let childSelectors = []
  walk(selectorListAst, {
    visit: Selector,
    enter: function (node) {
      childSelectors.push(cb(node))
    }
  })

  return childSelectors
}

const PSEUDO_FUNCTIONS = new KeywordSet([
  'nth-child',
  'where',
  'not',
  'is',
  'has',
  'nth-last-child',
  'matches',
  '-webkit-any',
  '-moz-any',
])

/** @param {import('css-tree').Selector} selector */
export function isAccessibility(selector) {
  let isA11y = false

  walk(selector, function (node) {
    if (node.type === AttributeSelector) {
      let name = node.name.name
      if (strEquals('role', name) || startsWith('aria-', name)) {
        isA11y = true
        return this.break
      }
    }
    // Test for [aria-] or [role] inside :is()/:where() and friends
    else if (node.type === PseudoClassSelector && PSEUDO_FUNCTIONS.has(node.name)) {
      let list = analyzeList(node, isAccessibility)

      for (let c of list) {
        if (c === true) {
          isA11y = true
          break
        }
      }

      return this.skip
    }
  })

  return isA11y;
}

/**
 * @param {import('css-tree').Selector} selector
 * @returns {boolean} Whether the selector contains a vendor prefix
 */
export function isPrefixed(selector) {
  let isPrefixed = false

  walk(selector, function (node) {
    let type = node.type

    if (type === PseudoElementSelector
      || type === TypeSelector
      || type === PseudoClassSelector
    ) {
      if (hasVendorPrefix(node.name)) {
        isPrefixed = true
        return this.break
      }
    }
  })

  return isPrefixed;
}

/**
 * @param {import('css-tree').Selector} selector
 * @returns {string[] | false} The pseudo-class name if it exists, otherwise false
 */
export function hasPseudoClass(selector) {
  let pseudos = []

  walk(selector, function (node) {
    if (node.type === PseudoClassSelector) {
      pseudos.push(node.name)
    }
  })

  if (pseudos.length === 0) {
    return false
  }

  return pseudos;
}

/**
 * Get the Complexity for the AST of a Selector Node
 * @param {import('css-tree').Selector} selector - AST Node for a Selector
 * @return {number} - The numeric complexity of the Selector and whether it's prefixed or not
 */
export function getComplexity(selector) {
  let complexity = 0

  walk(selector, function (node) {
    let type = node.type
    if (type === Selector || type === Nth) return

    complexity++

    if (type === PseudoElementSelector
      || type === TypeSelector
      || type === PseudoClassSelector
    ) {
      if (hasVendorPrefix(node.name)) {
        complexity++
      }
    }

    if (type === AttributeSelector) {
      if (node.value) {
        complexity++
      }
      return this.skip
    }

    if (type === PseudoClassSelector) {
      if (PSEUDO_FUNCTIONS.has(node.name)) {
        let list = analyzeList(node, getComplexity)

        // Bail out for empty/non-existent :nth-child() params
        if (list.length === 0) return

        for (let c of list) {
          complexity += c
        }
        return this.skip
      }
    }
  })

  return complexity
}

/**
 * Walk a selector node and trigger a callback every time a Combinator was found
 * We need create the `loc` for descendant combinators manually, because CSSTree
 * does not keep track of whitespace for us. We'll assume that the combinator is
 * alwas a single ` ` (space) character, even though there could be newlines or
 * multiple spaces
 * @param {import('css-tree').CssNode} node
 * @param {*} onMatch
 */
export function getCombinators(node, onMatch) {
  walk(node, function (
    /** @type {import('css-tree').CssNode} */ selectorNode,
    /** @type {import('css-tree').ListItem} */ item
  ) {
    if (selectorNode.type === Combinator) {
      let loc = selectorNode.loc
      let name = selectorNode.name

      // .loc is null when selectorNode.name === ' '
      if (loc === null) {
        let previousLoc = item.prev.data.loc.end
        let start = {
          offset: previousLoc.offset,
          line: previousLoc.line,
          column: previousLoc.column
        }

        onMatch({
          name,
          loc: {
            start,
            end: {
              offset: start.offset + 1,
              line: start.line,
              column: start.column + 1
            }
          }
        })
      } else {
        onMatch({
          name,
          loc
        })
      }
    }
  })
}

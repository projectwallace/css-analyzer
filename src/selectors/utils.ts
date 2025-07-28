import walk from 'css-tree/walker'
import { startsWith, strEquals } from '../string-utils.js'
import { hasVendorPrefix } from '../vendor-prefix.js'
import { KeywordSet } from '../keyword-set.js'
import type { SelectorList, Selector as CssTreeSelector, CssNode, PseudoClassSelector, TypeSelector, PseudoElementSelector, AttributeSelector, ListItem } from 'css-tree'

function analyzeList<T>(selectorListAst: SelectorList | CssTreeSelector | PseudoClassSelector, cb: (node: CssTreeSelector) => T): T[] {
  let childSelectors: T[] = []
  walk(selectorListAst, {
    visit: 'Selector',
    enter: function (node: CssTreeSelector) {
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

export function isAccessibility(selector: CssTreeSelector) {
  let isA11y = false

  walk(selector, function (node: CssNode) {
    if (node.type === 'AttributeSelector') {
      let name = node.name.name
      if (strEquals('role', name) || startsWith('aria-', name)) {
        isA11y = true
        return walk.break
      }
    }
    // Test for [aria-] or [role] inside :is()/:where() and friends
    else if (node.type === 'PseudoClassSelector' && PSEUDO_FUNCTIONS.has(node.name)) {
      let list = analyzeList<boolean>(node, isAccessibility)

      for (let c of list) {
        if (c === true) {
          isA11y = true
          break
        }
      }

      return walk.skip
    }
  })

  return isA11y;
}

/**
 * @returns Whether the selector contains a vendor prefix
 */
export function isPrefixed(selector: CssTreeSelector): boolean {
  let isPrefixed = false

  walk(selector, function (node: CssNode) {
    let type = node.type

    if (type === 'PseudoElementSelector'
      || type === 'TypeSelector'
      || type === 'PseudoClassSelector'
    ) {
      if (hasVendorPrefix((node as PseudoElementSelector | TypeSelector | PseudoClassSelector).name)) {
        isPrefixed = true
        return walk.break
      }
    }
  })

  return isPrefixed;
}

/**
 * @returns Pseudo-class names if they exists, otherwise false
 */
export function hasPseudoClass(selector: CssTreeSelector): string[] | false {
  let pseudos: string[] = []

  walk(selector, function (node: CssNode) {
    if (node.type === 'PseudoClassSelector') {
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
 * @return The numeric complexity of the Selector and whether it's prefixed or not
 */
export function getComplexity(selector: CssTreeSelector) {
  let complexity = 0

  walk(selector, function (node: CssNode) {
    let type = node.type
    if (type === 'Selector' || type === 'Nth') return

    complexity++

    if (type === 'PseudoElementSelector'
      || type === 'TypeSelector'
      || type === 'PseudoClassSelector'
    ) {
      if (hasVendorPrefix((node as PseudoClassSelector | TypeSelector | PseudoElementSelector).name)) {
        complexity++
      }
    }

    if (type === 'AttributeSelector') {
      if ((node as AttributeSelector).value) {
        complexity++
      }
      return walk.skip
    }

    if (type === 'PseudoClassSelector') {
      if (PSEUDO_FUNCTIONS.has((node as PseudoClassSelector).name)) {
        let list = analyzeList<number>((node as PseudoClassSelector), getComplexity)

        // Bail out for empty/non-existent :nth-child() params
        if (list.length === 0) return

        for (let c of list) {
          complexity += c
        }
        return walk.skip
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
 */
export function getCombinators(node: CssNode, onMatch: (node: { name: string, loc: { start: { offset: number, line: number, column: number }, end: { offset: number, line: number, column: number } } }) => void) {
  walk(node, function (
    selectorNode: CssNode,
    item: ListItem<CssNode>
  ) {
    if (selectorNode.type === 'Combinator') {
      let loc = selectorNode.loc
      let name = selectorNode.name

      // .loc is null when selectorNode.name === ' '
      if (loc === null) {
        let previousLoc = item.prev!.data.loc!.end
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
          loc: loc!
        })
      }
    }
  })
}

import walk from 'css-tree/walker'
import { startsWith, strEquals } from '../string-utils.js'
import { hasVendorPrefix } from '../vendor-prefix.js'

const COMPLEXITY = 3
const IS_A11Y = 4

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
function selectorListSpecificities(selectorListAst) {
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
  let A = 0
  let B = 0
  let C = 0
  let complexity = 0
  let isA11y = false

  walk(node, function (selector) {
    switch (selector.type) {
      case 'IdSelector': {
        A++
        complexity++
        break
      }
      case 'ClassSelector': {
        B++
        complexity++
        break
      }
      case 'AttributeSelector': {
        B++
        complexity++

        // Add 1 for [attr=value] (or any variation using *= $= ^= |= )
        if (Boolean(selector.value)) {
          complexity++
        }

        if (strEquals('role', selector.name.name) || startsWith('aria-', selector.name.name)) {
          isA11y = true
        }
        break
      }
      case 'PseudoElementSelector':
      case 'TypeSelector': {
        complexity++

        if (hasVendorPrefix(selector.name)) {
          complexity++
        }

        // 42 === '*'.charCodeAt(0)
        if (selector.name.charCodeAt(0) === 42 && selector.name.length === 1) {
          break
        }

        C++
        break
      }
      case 'PseudoClassSelector': {
        switch (selector.name) {
          case 'before':
          case 'after':
          case 'first-letter':
          case 'first-line': {
            C++
            complexity++
            return this.skip
          }

          // The specificity of an :is(), :not(), or :has() pseudo-class is
          // replaced by the specificity of the most specific complex
          // selector in its selector list argument.
          case 'where':
          case 'is':
          case 'has':
          case 'matches':
          case '-webkit-any':
          case '-moz-any':
          case 'not':
          case 'nth-child':
          case 'nth-last-child': {
            if (hasVendorPrefix(selector.name)) {
              complexity++
            }

            // The specificity of an :nth-child() or :nth-last-child() selector
            // is the specificity of the pseudo class itself (counting as one
            // pseudo-class selector) plus the specificity of the most
            // specific complex selector in its selector list argument (if any).
            if (selector.name === 'nth-child' || selector.name === 'nth-last-child') {
              // +1 for the pseudo class itself
              B++
            }

            const selectorList = selectorListSpecificities(selector)

            // Bail out for empty/non-existent :nth-child() params
            if (selectorList.length === 0) return

            // The specificity of a :where() pseudo-class is replaced by zero,
            // but it does count towards complexity.
            if (selector.name !== 'where') {
              const [topA, topB, topC] = selectorList[0]
              A += topA
              B += topB
              C += topC
            }

            for (let i = 0; i < selectorList.length; i++) {
              const listItem = selectorList[i]
              if (listItem[IS_A11Y] === 1) {
                isA11y = true
              }
              complexity += listItem[COMPLEXITY]
            }

            complexity++
            return this.skip
          }

          default: {
            // Regular pseudo classes have specificity [0,1,0]
            complexity++
            B++
            return this.skip
          }
        }
      }
      case 'Combinator': {
        complexity++
        break
      }
    }
  })

  return [
    A, B, C,
    complexity,
    isA11y ? 1 : 0,
  ]
}

export {
  analyzeSelector,
  compareSpecificity,
}
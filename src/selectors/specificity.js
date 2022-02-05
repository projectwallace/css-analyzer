import * as csstree from 'css-tree'

/**
 * @typedef {[number, number, number]} Specificity
 *
 * @typedef {import('css-tree').Selector} Selector
 */

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
  csstree.walk(selectorListAst, {
    visit: 'Selector',
    enter(node) {
      childSelectors.push(analyzeSpecificity(node))
    }
  })

  return childSelectors.sort((a, b) => compareSpecificity(a.specificity, b.specificity))
}

/**
 * Get the Specificity for the AST of a Selector Node
 * @param {import('css-tree').Selector} ast - AST Node for a Selector
 * @return {Object}
 * @property {Specificity} specificity
 * @property {number} complexity
 * @property {Boolean} isId
 * @property {Boolean} isA11y
 */
const analyzeSpecificity = (ast) => {
  let A = 0
  let B = 0
  let C = 0
  let complexity = 0
  let isA11y = false

  csstree.walk(ast, {
    enter: function (selector) {
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

          if (Boolean(selector.value)) {
            complexity++
          }
          isA11y = selector.name.name === 'role' || selector.name.name.startsWith('aria-')
          break
        }
        case 'PseudoElementSelector':
        case 'TypeSelector': {
          if (selector.name !== '*') {
            C++
          }
          complexity++
          break
        }
        case 'PseudoClassSelector': {
          if (['before', 'after', 'first-letter', 'first-line'].includes(selector.name)) {
            C++
            complexity++
            return this.skip
          }
          // The specificity of an :is(), :not(), or :has() pseudo-class is
          // replaced by the specificity of the most specific complex
          // selector in its selector list argument.

          // CSSTree doesn't parse the arguments of :is, :has and :matches,
          // so we need to create an AST out of them ourselves
          if (['is', 'has', 'matches'].includes(selector.name)) {
            const rawSelectorList = csstree.find(selector, ({ type }) => type === 'Raw')
            const childAst = csstree.parse(rawSelectorList.value, { context: 'selectorList' })
            const selectorList = selectorListSpecificities(childAst)
            const [topA, topB, topC] = selectorList[0].specificity
            A += topA
            B += topB
            C += topC

            for (let i = 0; i < selectorList.length; i++) {
              complexity += selectorList[i].complexity
            }
            complexity++
            return
          }

          // CSSTree *does* parse the arguments of the :not() pseudo-class,
          // so we have direct access to the AST, instead of having to parse
          // the arguments ourselves.
          if (selector.name === 'not') {
            const selectorList = selectorListSpecificities(selector)
            const [topA, topB, topC] = selectorList[0].specificity
            A += topA
            B += topB
            C += topC

            for (let i = 0; i < selectorList.length; i++) {
              complexity += selectorList[i].complexity
            }
            complexity++
            return this.skip
          }

          // The specificity of an :nth-child() or :nth-last-child() selector
          // is the specificity of the pseudo class itself (counting as one
          // pseudo-class selector) plus the specificity of the most
          // specific complex selector in its selector list argument (if any).
          if (['nth-child', 'nth-last-child'].includes(selector.name)) {
            // +1 for the pseudo class itself
            B++

            const childSelectors = selectorListSpecificities(selector)

            if (childSelectors.length === 0) {
              return
            }

            const [topA, topB, topC] = childSelectors[0].specificity
            A += topA
            B += topB
            C += topC

            for (let i = 0; i < childSelectors.length; i++) {
              complexity += childSelectors[i].complexity;
            }

            complexity++
            return
          }

          // The specificity of a :where() pseudo-class is replaced by zero,
          // but it does count towards complexity.
          if (selector.name === 'where') {
            const rawSelectorList = csstree.find(selector, ({ type }) => type === 'Raw')
            const childAst = csstree.parse(rawSelectorList.value, { context: 'selectorList' })
            const childSelectors = selectorListSpecificities(childAst)

            for (let i = 0; i < childSelectors.length; i++) {
              complexity += childSelectors[i].complexity;
            }

            complexity++
            return
          }

          // Regular pseudo classes have specificity [0,1,0]
          complexity++
          B++
          break
        }
        case 'Combinator': {
          complexity++
          break
        }
      }
    }
  })

  return {
    /** @type Specificity */
    specificity: [A, B, C],
    complexity,
    isId: A > 0,
    isA11y
  }
}

export {
  analyzeSpecificity,
  compareSpecificity,
}
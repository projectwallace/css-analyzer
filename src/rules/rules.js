import walk from 'css-tree/walker'
import { AggregateCollection } from '../aggregate-collection.js'

const analyzeRules = ({ rules }) => {
  /** @type number */
  const totalRules = rules.length
  const selectorsPerRule = new AggregateCollection()
  const declarationsPerRule = new AggregateCollection()

  let emptyRules = 0

  for (let i = 0; i < totalRules; i++) {
    let numSelectors = 0
    let numDeclarations = 0

    walk(rules[i], {
      enter: function (childNode) {
        if (childNode.type === 'Selector') {
          numSelectors++
          return this.skip
        }

        if (childNode.type === 'Declaration') {
          numDeclarations++
          return this.skip
        }
      }
    })

    if (numDeclarations === 0) {
      emptyRules++
    }

    // For later aggregations
    selectorsPerRule.add(numSelectors)
    declarationsPerRule.add(numDeclarations)
  }

  return {
    total: totalRules,
    empty: {
      total: emptyRules,
      ratio: totalRules === 0 ? 0 : emptyRules / totalRules
    },
    selectors: {
      ...selectorsPerRule.aggregate(),
      items: selectorsPerRule.toArray(),
    },
    declarations: {
      ...declarationsPerRule.aggregate(),
      items: declarationsPerRule.toArray()
    },
  }
}

export {
  analyzeRules
}
import * as csstree from 'css-tree'
import { AggregateCollection } from '../aggregate-collection.js'

const analyzeRules = ({ rules }) => {
  /** @type number */
  const totalRules = rules.length
  const selectorsPerRule = new AggregateCollection(totalRules)
  const declarationsPerRule = new AggregateCollection(totalRules)

  let emptyRules = 0

  for (let i = 0; i < totalRules; i++) {
    let selectors = 0
    let declarations = 0

    csstree.walk(rules[i], {
      enter: function (childNode) {
        if (childNode.type === 'Selector') {
          selectors++
          return this.skip
        }

        if (childNode.type === 'Declaration') {
          declarations++
          return this.skip
        }
      }
    })

    if (declarations === 0) {
      emptyRules++
    }

    // For later aggregations
    selectorsPerRule.add(selectors)
    declarationsPerRule.add(declarations)
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
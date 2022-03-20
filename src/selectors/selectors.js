import { analyzeSpecificity, compareSpecificity } from './specificity.js'
import { AggregateCollection } from '../aggregate-collection.js'
import { CountableCollection } from '../countable-collection.js'

const analyzeSelectors = ({ stringifyNode, selectors }) => {
  const counts = Object.create(null)
  const cache = Object.create(null)
  /** @type number */
  const totalSelectors = selectors.length

  /** @type [number,number,number] */
  let maxSpecificity
  /** @type [number,number,number] */
  let minSpecificity
  let specificityA = new AggregateCollection()
  let specificityB = new AggregateCollection()
  let specificityC = new AggregateCollection()
  let totalUnique = 0
  const complexityAggregator = new AggregateCollection()

  /** @type [number,number,number][] */
  const specificities = []
  /** @type number[] */
  const complexities = []
  const ids = new CountableCollection()
  const a11y = new CountableCollection()

  for (let i = 0; i < totalSelectors; i++) {
    /** @type import('css-tree').Selector */
    const node = selectors[i];
    /** @type string */
    const value = stringifyNode(node)

    const { specificity, complexity, isId, isA11y } = cache[value] || analyzeSpecificity(node)

    if (isId) {
      ids.push(value)
    }

    if (isA11y) {
      a11y.push(value)
    }

    if (!cache[value]) {
      cache[value] = { complexity, specificity, isId, isA11y }
      totalUnique++
      counts[value] = 1
    } else {
      counts[value]++
    }

    complexityAggregator.add(complexity)

    if (maxSpecificity === undefined) {
      maxSpecificity = specificity
    }

    if (minSpecificity === undefined) {
      minSpecificity = specificity
    }

    specificityA.add(specificity[0])
    specificityB.add(specificity[1])
    specificityC.add(specificity[2])

    if (minSpecificity !== undefined && compareSpecificity(minSpecificity, specificity) < 0) {
      minSpecificity = specificity
    }

    if (maxSpecificity !== undefined && compareSpecificity(maxSpecificity, specificity) > 0) {
      maxSpecificity = specificity
    }

    specificities.push(specificity)
    complexities.push(complexity)
  }

  const aggregatesA = specificityA.aggregate()
  const aggregatesB = specificityB.aggregate()
  const aggregatesC = specificityC.aggregate()
  const complexityCount = new CountableCollection(complexities).count()

  return {
    total: totalSelectors,
    totalUnique,
    uniquenessRatio: totalSelectors === 0 ? 0 : totalUnique / totalSelectors,
    specificity: {
      /** @type [number, number, number] */
      min: minSpecificity,
      /** @type [number, number, number] */
      max: maxSpecificity,
      /** @type [number, number, number] */
      sum: [aggregatesA.sum, aggregatesB.sum, aggregatesC.sum],
      /** @type [number, number, number] */
      mean: [aggregatesA.mean, aggregatesB.mean, aggregatesC.mean],
      /** @type [number, number, number] */
      mode: [aggregatesA.mode, aggregatesB.mode, aggregatesC.mode],
      /** @type [number, number, number] */
      median: [aggregatesA.median, aggregatesB.median, aggregatesC.median],
      /** @type [number, number, number][] */
      items: specificities
    },
    complexity: {
      ...complexityAggregator.aggregate(),
      ...complexityCount,
      items: complexities,
    },
    id: {
      ...ids.count(),
      ratio: totalSelectors === 0 ? 0 : ids.size() / totalSelectors,
    },
    accessibility: {
      ...a11y.count(),
      ratio: totalSelectors === 0 ? 0 : a11y.size() / totalSelectors,
    },
  }
}

export {
  analyzeSelectors
}
import { analyzeSpecificity, compareSpecificity } from './specificity.js'
import { AggregateCollection } from '../aggregate-collection.js'
import { CountableCollection } from '../countable-collection.js'

/** @typedef {[number, number, number]} Specificity */

const analyzeSelectors = ({ stringifyNode, selectors }) => {
  const counts = Object.create(null)
  const cache = Object.create(null)
  const totalSelectors = selectors.length

  /** @type Specificity|undefined */
  let maxSpecificity
  /** @type Specificity|undefined */
  let minSpecificity
  let specificityA = new AggregateCollection(totalSelectors)
  let specificityB = new AggregateCollection(totalSelectors)
  let specificityC = new AggregateCollection(totalSelectors)
  let totalUnique = 0
  const complexityAggregator = new AggregateCollection(totalSelectors);

  const specificities = []
  const complexities = []
  const ids = new CountableCollection()
  const a11y = new CountableCollection()
  const keyframes = new CountableCollection()

  for (let i = 0; i < totalSelectors; i++) {
    const node = selectors[i];
    const value = stringifyNode(node)

    if (node.isKeyframeSelector) {
      keyframes.push(value)
      // Do not attempt to further analyze <keyframe-selectors>
      continue
    }

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
      sum: [aggregatesA.sum, aggregatesB.sum, aggregatesC.sum],
      min: minSpecificity,
      max: maxSpecificity,
      mean: [aggregatesA.mean, aggregatesB.mean, aggregatesC.mean],
      mode: [aggregatesA.mode, aggregatesB.mode, aggregatesC.mode],
      median: [aggregatesA.median, aggregatesB.median, aggregatesC.median],
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
    keyframes: {
      ...keyframes.count(),
      ratio: totalSelectors === 0 ? 0 : keyframes.size() / totalSelectors,
    }
  }
}

export {
  analyzeSelectors
}
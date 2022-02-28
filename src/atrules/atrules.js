
import walk from 'css-tree/walker'
import { AggregateCollection } from '../aggregate-collection.js'
import { CountableCollection } from '../countable-collection.js'
import { hasVendorPrefix } from '../vendor-prefix.js'

const analyzeAtRules = ({ atrules, stringifyNode }) => {
  /** @type {{[index: string]: string}[]} */
  const fontfaces = []
  const imports = new CountableCollection()
  const importComplexities = []
  const medias = new CountableCollection()
  const charsets = new CountableCollection()
  const supports = new CountableCollection()
  const supportComplexities = []
  const keyframes = new CountableCollection()
  const prefixedKeyframes = new CountableCollection()
  const containers = new CountableCollection()

  const machine = {
    'font-face': (node) => {
      /** @type {[index: string]: string} */
      const descriptors = {}

      node.block.children.forEach(
        /** @param {import('css-tree').Declaration} descriptor */
        descriptor => (descriptors[descriptor.property] = stringifyNode(descriptor.value))
      )

      fontfaces.push(descriptors)
    },
    'media': node => medias.push(stringifyNode(node.prelude)),
    'supports': node => {
      supports.push(stringifyNode(node.prelude))
      let complexity = 0
      walk(node.prelude, function (preludeChild) {
        if (preludeChild.type === 'Declaration') {
          complexity += 1
        }
        if (preludeChild.name === 'not') {
          complexity += 1
        }
      })
      supportComplexities.push(complexity)
      return node.break
    },
    'keyframes': node => keyframes.push(`@${node.name} ${stringifyNode(node.prelude)}`),
    'import': node => {
      imports.push(stringifyNode(node.prelude))
      let complexity = 0
      walk(node.prelude, function (preludeChild) {
        if (preludeChild.type !== 'MediaQuery') {
          return preludeChild.skip
        }

        preludeChild.children.forEach(mqChild => {
          if (mqChild.name === 'and') return
          complexity += 1
        })
      })
      importComplexities.push(complexity)
      return node.break
    },
    'charset': node => charsets.push(stringifyNode(node.prelude)),
    'container': node => containers.push(stringifyNode(node.prelude)),
  }

  for (let i = 0; i < atrules.length; i++) {
    /** @type {import('css-tree').Atrule} */
    const node = atrules[i]
    const nodeName = node.name
    const action = machine[nodeName]
    if (action) {
      action(node)
      continue
    }

    if (nodeName.endsWith('keyframes')) {
      const name = `@${nodeName} ${stringifyNode(node.prelude)}`
      keyframes.push(name)

      if (hasVendorPrefix(nodeName)) {
        prefixedKeyframes.push(name)
      }
      continue
    }
  }

  const importsAggregator = new AggregateCollection(importComplexities.length)
  importComplexities.map(c => importsAggregator.add(c))

  const supportsAggregator = new AggregateCollection(supportComplexities.length)
  supportComplexities.map(c => supportsAggregator.add(c))

  return {
    fontface: {
      total: fontfaces.length,
      totalUnique: fontfaces.length,
      unique: fontfaces,
      uniquenessRatio: 1
    },
    import: Object.assign(
      imports.count(), {
      complexity: Object.assign({
        items: importComplexities,
      }, importsAggregator.aggregate()),
    }),
    media: medias.count(),
    charset: charsets.count(),
    supports: Object.assign(
      supports.count(), {
      complexity: Object.assign({
        items: supportComplexities,
      }, supportsAggregator.aggregate()),
    }),
    keyframes: {
      ...keyframes.count(),
      prefixed: {
        ...prefixedKeyframes.count(),
        ratio: keyframes.size() === 0 ? 0 : prefixedKeyframes.size() / keyframes.size()
      }
    },
    container: containers.count(),
  }
}

export {
  analyzeAtRules
}
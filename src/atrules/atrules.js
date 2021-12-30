import { CountableCollection } from '../countable-collection.js'
import { hasVendorPrefix } from '../vendor-prefix.js'

const analyzeAtRules = ({ atrules, stringifyNode }) => {
  const fontfaces = []
  const imports = new CountableCollection()
  const medias = new CountableCollection()
  const charsets = new CountableCollection()
  const supports = new CountableCollection()
  const keyframes = new CountableCollection()
  const prefixedKeyframes = new CountableCollection()
  const containers = new CountableCollection()

  const machine = {
    'font-face': (node) => {
      const descriptors = {}

      node.block.children.forEach(descriptor => {
        descriptors[descriptor.property] = stringifyNode(descriptor.value)
      })

      fontfaces.push(descriptors)
    },
    'media': node => medias.push(node.prelude.value),
    'supports': node => supports.push(node.prelude.value),
    'keyframes': node => keyframes.push(`@${node.name} ${node.prelude.value}`),
    'import': node => imports.push(node.prelude.value),
    'charset': node => charsets.push(node.prelude.value),
    'container': node => containers.push(node.prelude.value),
  }

  for (let i = 0; i < atrules.length; i++) {
    const node = atrules[i]
    const nodeName = node.name
    const action = machine[nodeName]
    if (action) {
      action(node)
      continue
    }

    if (nodeName.endsWith('keyframes')) {
      const name = `@${nodeName} ${node.prelude.value}`
      keyframes.push(name)

      if (hasVendorPrefix(nodeName)) {
        prefixedKeyframes.push(name)
      }
      continue
    }
  }

  return {
    fontface: {
      total: fontfaces.length,
      totalUnique: fontfaces.length,
      unique: fontfaces,
      uniquenessRatio: 1
    },
    import: imports.count(),
    media: medias.count(),
    charset: charsets.count(),
    supports: supports.count(),
    keyframes: {
      ...keyframes.count(),
      prefixed: {
        ...prefixedKeyframes.count(),
        ratio: prefixedKeyframes.size() / keyframes.size()
      }
    },
    container: containers.count(),
  }
}

export {
  analyzeAtRules
}
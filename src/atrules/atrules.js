import { CountableCollection } from '../countable-collection.js'
import { hasVendorPrefix } from '../vendor-prefix.js'
import { endsWith } from '../string-utils.js'

const analyzeAtRules = ({ atrules, stringifyNode }) => {
  /** @type {{[index: string]: string}[]} */
  const fontfaces = []
  const layers = new CountableCollection()
  const imports = new CountableCollection()
  const medias = new CountableCollection()
  const charsets = new CountableCollection()
  const supports = new CountableCollection()
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
    'media': node => medias.push(node.prelude),
    'supports': node => supports.push(node.prelude),
    'keyframes': node => keyframes.push(`@${node.name} ${node.prelude}`),
    'import': node => imports.push(node.prelude),
    'charset': node => charsets.push(node.prelude),
    'container': node => containers.push(node.prelude),
    'layer': node => {
      node.prelude.trim()
        .split(',')
        .map(name => name.trim())
        .forEach(name => layers.push(name))
    },
  }

  for (let i = 0; i < atrules.length; i++) {
    /** @type {import('css-tree').Atrule} */
    const node = atrules[i]
    const atRuleName = node.name
    const action = machine[atRuleName]
    if (action) {
      action(node)
      continue
    }

    if (endsWith('keyframes', atRuleName)) {
      const name = `@${atRuleName} ${node.prelude}`
      keyframes.push(name)

      if (hasVendorPrefix(atRuleName)) {
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
      uniquenessRatio: fontfaces.length === 0 ? 0 : 1
    },
    import: imports.count(),
    media: medias.count(),
    charset: charsets.count(),
    supports: supports.count(),
    keyframes: Object.assign(
      keyframes.count(), {
      prefixed: Object.assign(
        prefixedKeyframes.count(), {
        ratio: keyframes.size() === 0 ? 0 : prefixedKeyframes.size() / keyframes.size()
      }),
    }),
    container: containers.count(),
    layer: layers.count(),
  }
}

export {
  analyzeAtRules
}
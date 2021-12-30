import { CountableCollection } from '../countable-collection.js'

const keywords = {
  'auto': 1,
  'inherit': 1,
  'initial': 1,
  'unset': 1,
  'revert': 1,
  'none': 1, // for `text-shadow`
}

const analyzeValues = ({ values, stringifyNode }) => {
  const all = new CountableCollection()

  for (let i = 0; i < values.length; i++) {
    const node = values[i]
    const firstChild = node.children.first

    if (!firstChild) continue
    if (firstChild.type === 'Identifier' && keywords[firstChild.name]) continue

    all.push(stringifyNode(node))
  }

  return all.count()
}

export {
  analyzeValues
}
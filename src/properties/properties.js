import { CountableCollection } from '../countable-collection.js'

const analyzeProperties = ({ properties }) => {
  const all = new CountableCollection(properties.map(p => p.authored))
  const prefixed = new CountableCollection()
  const hacks = new CountableCollection()
  const customs = new CountableCollection()
  const totalProperties = properties.length

  for (let i = 0; i < totalProperties; i++) {
    const property = properties[i]

    if (property.vendor) {
      prefixed.push(property.authored)
      continue
    }

    if (property.hack) {
      hacks.push(property.authored)
      continue
    }

    if (property.custom) {
      customs.push(property.authored)
      continue
    }
  }

  return {
    ...all.count(),
    prefixed: {
      ...prefixed.count(),
      ratio: prefixed.size() / totalProperties,
    },
    custom: {
      ...customs.count(),
      ratio: customs.size() / totalProperties,
    },
    browserhacks: {
      ...hacks.count(),
      ratio: hacks.size() / totalProperties,
    }
  }
}

export {
  analyzeProperties
}
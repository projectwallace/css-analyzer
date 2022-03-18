import { CountableCollection } from '../countable-collection.js'

const analyzeProperties = ({ properties }) => {
  const all = new CountableCollection()
  const prefixed = new CountableCollection()
  const hacks = new CountableCollection()
  const customs = new CountableCollection()
  const totalProperties = properties.length

  for (let i = 0; i < totalProperties; i++) {
    const { vendor, hack, custom, authored } = properties[i]
    all.push(authored)

    if (vendor) {
      prefixed.push(authored)
      continue
    }

    if (hack) {
      hacks.push(authored)
      continue
    }

    if (custom) {
      customs.push(authored)
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
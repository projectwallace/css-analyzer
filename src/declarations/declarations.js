const analyzeDeclarations = ({ declarations }) => {
  /** @type number */
  const total = declarations.length
  const cache = Object.create(null)
  let totalUnique = 0

  for (let i = 0; i < total; i++) {
    const declaration = declarations[i]

    if (!cache[declaration]) {
      cache[declaration] = 1
      totalUnique++
    }
  }

  return {
    total,
    unique: {
      total: totalUnique,
      ratio: total === 0 ? 0 : totalUnique / total,
    },
  }
}

export {
  analyzeDeclarations
}
const analyzeDeclarations = ({ declarations }) => {
  /** @type number */
  const total = declarations.length
  const cache = Object.create(null)
  let importants = 0
  let totalUnique = 0
  let totalInKeyframes = 0

  for (let i = 0; i < total; i++) {
    const { stringified, important, inKeyframe } = declarations[i]

    if (important === true) {
      importants++

      if (inKeyframe) {
        totalInKeyframes++
      }
    }

    if (!cache[stringified]) {
      cache[stringified] = 1
      totalUnique++
    }
  }

  return {
    total,
    unique: {
      total: totalUnique,
      ratio: total === 0 ? 0 : totalUnique / total,
    },
    importants: {
      total: importants,
      ratio: total === 0 ? 0 : importants / total,
      inKeyframes: {
        total: totalInKeyframes,
        ratio: importants === 0 ? 0 : totalInKeyframes / importants,
      },
    },
  }
}

export {
  analyzeDeclarations
}
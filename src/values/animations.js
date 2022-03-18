import { CountableCollection } from '../countable-collection.js'

const timingKeywords = {
  'linear': 1,
  'ease': 1,
  'ease-in': 1,
  'ease-out': 1,
  'ease-in-out': 1,
  'step-start': 1,
  'step-end': 1,
}

const analyzeAnimations = ({ animations, durations, timingFunctions, stringifyNode }) => {
  const allDurations = new CountableCollection(durations)
  const allTimingFunctions = new CountableCollection(timingFunctions)

  for (let index = 0; index < animations.length; index++) {
    const children = animations[index]
    // Flag to know if we've grabbed the first Duration
    // yet (the first Dimension in a shorthand)
    let durationFound = false

    children.forEach(child => {
      // Right after a ',' we start over again
      if (child.type === 'Operator') {
        return durationFound = false
      }
      if (child.type === 'Dimension' && durationFound === false) {
        durationFound = true
        return allDurations.push(stringifyNode(child))
      }
      if (child.type === 'Identifier' && timingKeywords[child.name]) {
        return allTimingFunctions.push(stringifyNode(child))
      }
      if (child.type === 'Function'
        && (
          child.name === 'cubic-bezier' || child.name === 'steps'
        )
      ) {
        return allTimingFunctions.push(stringifyNode(child))
      }
    })
  }

  return {
    durations: allDurations.count(),
    timingFunctions: allTimingFunctions.count(),
  }
}

export {
  analyzeAnimations
}
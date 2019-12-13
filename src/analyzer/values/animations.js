const {parse} = require('postcss-values-parser')
const splitValue = require('split-css-value')
const uniquer = require('../../utils/uniquer')
const {KEYWORDS} = require('../../utils/css')
const durationSort = require('../../utils/duration-sort')

function getSingleDuration(animation) {
  let duration

  parse(animation).walkNumerics(node => {
    // The first time-value is always the duration, as per spec
    if (duration) {
      return
    }

    duration = node.toString()
  })

  return duration
}

function getDuration(animation) {
  return splitValue(animation)
    .map(animation => getSingleDuration(animation))
    .filter(Boolean)
}

function getSingleTimingFunction(animation) {
  let timingFunction

  parse(animation).walk(node => {
    // There should only be one timing function per shorthand
    if (timingFunction) {
      return
    }

    // Look for timing keywords
    if (
      node.type === 'word' &&
      [
        'ease',
        'ease-in',
        'ease-in-out',
        'ease-out',
        'linear',
        'step-start',
        'step-end'
      ].includes(node.toString())
    ) {
      timingFunction = node.toString()
      return
    }

    // If there's no keyword, it should either be cubic-bezier() or steps()
    if (node.type === 'func' && ['cubic-bezier', 'steps'].includes(node.name)) {
      timingFunction = node.toString()
    }
  })

  return timingFunction
}

function getTimingFunction(animation) {
  return splitValue(animation)
    .map(animation => getSingleTimingFunction(animation))
    .filter(Boolean)
}

module.exports = declarations => {
  const all = declarations.filter(({value}) => !KEYWORDS.includes(value))

  const durations = all
    // First, find all durations directly
    .filter(({property}) =>
      ['animation-duration', 'transition-duration'].includes(property)
    )
    .map(declaration => declaration.value)
    // Then, find more through the shorthand declarations
    .concat(
      ...all
        .filter(({property}) => ['animation', 'transition'].includes(property))
        .map(({value}) => getDuration(value))
    )

  const {unique: uniqueDurations, totalUnique: totalUniqueDurations} = uniquer(
    durations,
    durationSort
  )

  const timingFunctions = all
    // First, find all timing-functions directly
    .filter(({property}) =>
      ['animation-timing-function', 'transition-timing-function'].includes(
        property
      )
    )
    .map(declaration => declaration.value)
    // Then, find more through the shorthand declarations
    .concat(
      ...all
        .filter(({property}) => ['animation', 'transition'].includes(property))
        .map(({value}) => getTimingFunction(value))
    )

  const {
    unique: uniqueTimingFunctions,
    totalUnique: totalUniqueTimingFunctions
  } = uniquer(timingFunctions)

  return {
    durations: {
      total: durations.length,
      unique: uniqueDurations,
      totalUnique: totalUniqueDurations
    },
    timingFunctions: {
      total: timingFunctions.length,
      unique: uniqueTimingFunctions,
      totalUnique: totalUniqueTimingFunctions
    }
  }
}

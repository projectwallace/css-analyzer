const uniquer = require('../../utils/uniquer')

module.exports = atRules => {
  const all = atRules
    .filter(rule => {
      return [
        'keyframes',
        '-moz-keyframes',
        '-webkit-keyframes',
        '-ms-keyframes',
        '-o-keyframes'
      ].includes(rule.type)
    })
    .map(rule => rule.params)

  return {
    total: all.length,
    ...uniquer(all)
  }
}

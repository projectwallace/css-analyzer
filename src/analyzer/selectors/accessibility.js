const uniquer = require('../../utils/uniquer')

function isA11ySelector(selector) {
  return selector.includes('[aria-') || selector.includes('[role=')
}

module.exports = selectors => {
  const all = selectors.filter(isA11ySelector)

  return {
    total: all.length,
    ...uniquer(all)
  }
}

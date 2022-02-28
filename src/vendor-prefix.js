const HYPHENMINUS = 45; // '-'.charCodeAt()

/**
 * @param {string} keyword
 * @returns {boolean}
 * @todo Replace with CSSTree's implementation once new version is released
 * @see https://github.com/csstree/csstree/commit/a2f5edb2244f6104bd76caf7c58b653b22ed611b
 */
function hasVendorPrefix(keyword) {
  if (keyword.charCodeAt(0) === HYPHENMINUS && keyword.charCodeAt(1) !== HYPHENMINUS) {
    // String must have a 2nd occurrence of '-', at least at position 3 (offset=2)
    if (keyword.indexOf('-', 2) !== -1) {
      return true
    }
  }

  return false
}

export {
  hasVendorPrefix
}
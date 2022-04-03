/**
 * Case-insensitive compare two character codes
 * @param {string} charA
 * @param {string} charB
 * @see https://github.com/csstree/csstree/blob/41f276e8862d8223eeaa01a3d113ab70bb13d2d9/lib/tokenizer/utils.js#L22
 */
function compareChar(referenceCode, testCode) {
  // if uppercase
  if (testCode >= 0x0041 && testCode <= 0x005A) {
    // shifting the 6th bit makes a letter lowercase
    testCode = testCode | 32
  }
  return referenceCode === testCode
}

/**
 * Case-insensitive string-comparison
 * @param {string} base
 * @param {string} test
 * @returns {boolean} true if the two strings are the same, false otherwise
 */
export function strEquals(base, test) {
  if (base.length !== test.length) return false

  for (let i = 0; i < base.length; i++) {
    if (compareChar(base.charCodeAt(i), test.charCodeAt(i)) === false) {
      return false
    }
  }

  return true
}

/**
 * Case-insensitive testing whether a string ends with a given substring
 * @param {string} base e.g. '-webkit-transform'
 * @param {string} cmp e.g. 'transform'
 * @returns {boolean} true if `test` ends with `base`, false otherwise
 */
export function endsWith(base, test) {
  const offset = test.length - base.length

  if (offset < 0) {
    return false
  }

  for (let i = test.length - 1; i >= offset; i--) {
    if (compareChar(base.charCodeAt(i - offset), test.charCodeAt(i)) === false) {
      return false
    }
  }

  return true
}

/**
 * Case-insensitive testing whether a string starts with a given substring
 * @param {string} base
 * @param {test} test
 * @returns {boolean} true if `test` starts with `base`, false otherwise
 */
export function startsWith(base, test) {
  if (test.length < base.length) return false

  for (let i = 0; i < base.length; i++) {
    if (compareChar(base.charCodeAt(i), test.charCodeAt(i)) === false) {
      return false
    }
  }

  return true
}

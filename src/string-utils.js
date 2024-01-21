/**
 * Case-insensitive compare two character codes
 * @param {string} referenceCode
 * @param {string} testCode
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
 * @example
 * strEquals('test', 'test') // true
 * strEquals('test', 'TEST') // true
 * strEquals('test', 'TesT') // true
 * strEquals('test', 'derp') // false
 *
 * @param {string} base The string to check against
 * @param {string} maybe The test string, possibly containing uppercased characters
 * @returns {boolean} true if the two strings are the same, false otherwise
 */
export function strEquals(base, maybe) {
  let len = base.length;
  if (len !== maybe.length) return false

  for (let i = 0; i < len; i++) {
    if (compareChar(base.charCodeAt(i), maybe.charCodeAt(i)) === false) {
      return false
    }
  }

  return true
}

/**
 * Case-insensitive testing whether a string ends with a given substring
 *
 * @example
 * endsWith('test', 'my-test') // true
 * endsWith('test', 'est') // false
 *
 * @param {string} base e.g. '-webkit-transform'
 * @param {string} maybe e.g. 'transform'
 * @returns {boolean} true if `test` ends with `base`, false otherwise
 */
export function endsWith(base, maybe) {
  let len = maybe.length
  let offset = len - base.length

  if (offset < 0) {
    return false
  }

  for (let i = len - 1; i >= offset; i--) {
    if (compareChar(base.charCodeAt(i - offset), maybe.charCodeAt(i)) === false) {
      return false
    }
  }

  return true
}

/**
 * Case-insensitive testing whether a string starts with a given substring
 *
 * @example
 * startsWith('test', 'my-test') // false
 * startsWith('test', 'tes') // true
 * startsWith('test', 'test-me') // true
 *
 * @param {string} base
 * @param {string} maybe
 * @returns {boolean} true if `base` starts with `maybe`, false otherwise
 */
export function startsWith(base, maybe) {
  let len = base.length
  if (maybe.length < len) return false

  for (let i = 0; i < len; i++) {
    if (compareChar(base.charCodeAt(i), maybe.charCodeAt(i)) === false) {
      return false
    }
  }

  return true
}

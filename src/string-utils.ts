/**
 * Case-insensitive compare two character codes
 * @see https://github.com/csstree/csstree/blob/41f276e8862d8223eeaa01a3d113ab70bb13d2d9/lib/tokenizer/utils.js#L22
 */
function compare_char(referenceCode: number, testCode: number): boolean {
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
 * str_equals('test', 'test') // true
 * str_equals('test', 'TEST') // true
 * str_equals('test', 'TesT') // true
 * str_equals('test', 'derp') // false
 *
 * @param base The string to check against
 * @param maybe The test string, possibly containing uppercased characters
 * @returns true if the two strings are the same, false otherwise
 */
export function str_equals(base: string, maybe: string): boolean {
  if (base === maybe) return true

  let len = base.length;
  if (len !== maybe.length) return false


  for (let i = 0; i < len; i++) {
    if (compare_char(base.charCodeAt(i), maybe.charCodeAt(i)) === false) {
      return false
    }
  }

  return true
}

/**
 * Case-insensitive testing whether a string ends with a given substring
 *
 * @example
 * ends_with('test', 'my-test') // true
 * ends_with('test', 'est') // false
 *
 * @param base e.g. '-webkit-transform'
 * @param maybe e.g. 'transform'
 * @returns true if `test` ends with `base`, false otherwise
 */
export function ends_with(base: string, maybe: string): boolean {
  if (base === maybe) return true

  let len = maybe.length
  let offset = len - base.length

  if (offset < 0) {
    return false
  }

  for (let i = len - 1; i >= offset; i--) {
    if (compare_char(base.charCodeAt(i - offset), maybe.charCodeAt(i)) === false) {
      return false
    }
  }

  return true
}

/**
 * Case-insensitive testing whether a string starts with a given substring
 *
 * @example
 * starts_with('test', 'my-test') // false
 * starts_with('test', 'tes') // true
 * starts_with('test', 'test-me') // true
 *
 * @param base
 * @param maybe
 * @returns true if `base` starts with `maybe`, false otherwise
 */
export function starts_with(base: string, maybe: string): boolean {
  if (base === maybe) return true

  let len = base.length
  if (maybe.length < len) return false

  for (let i = 0; i < len; i++) {
    if (compare_char(base.charCodeAt(i), maybe.charCodeAt(i)) === false) {
      return false
    }
  }

  return true
}

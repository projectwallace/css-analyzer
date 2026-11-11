export function unquote(str: string): string {
	return str.replaceAll(/(?:^['"])|(?:['"]$)/g, '')
}

/**
 * Case-insensitive compare two character codes
 * @see https://github.com/csstree/csstree/blob/41f276e8862d8223eeaa01a3d113ab70bb13d2d9/lib/tokenizer/utils.js#L22
 */
function compare_char(reference_code: number, test_code: number): boolean {
	// if uppercase
	if (test_code >= 0x0041 && test_code <= 0x005a) {
		// shifting the 6th bit makes a letter lowercase
		test_code = test_code | 32
	}
	return reference_code === test_code
}

/**
 * Case-insensitive testing whether a string ends with a given substring
 *
 * @example
 * ends_with('test', 'my-test') // true
 * ends_with('test', 'est') // false
 *
 * @param base e.g. '-webkit-transform'; MUST be lowercase
 * @param maybe e.g. 'transform'
 * @returns true if `test` ends with `base`, false otherwise
 */
export function ends_with(base: string, maybe: string): boolean {
	if (base === maybe) {
		return true
	}

	const len = maybe.length
	const offset = len - base.length

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

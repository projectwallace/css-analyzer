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
 * Case-insensitive testing whether a string ends with a given suffix
 *
 * @example
 * ends_with('test', 'my-test') // true
 * ends_with('test', 'est') // false
 *
 * @param suffix e.g. 'transform'; MUST be lowercase
 * @param text e.g. '-webkit-transform'
 * @returns true if `text` ends with `suffix`, false otherwise
 */
export function ends_with(suffix: string, text: string): boolean {
	if (suffix === text) {
		return true
	}

	const len = text.length
	const offset = len - suffix.length

	if (offset < 0) {
		return false
	}

	for (let i = len - 1; i >= offset; i--) {
		if (compare_char(suffix.charCodeAt(i - offset), text.charCodeAt(i)) === false) {
			return false
		}
	}

	return true
}

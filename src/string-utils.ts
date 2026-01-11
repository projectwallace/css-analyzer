import { str_equals, str_starts_with } from '@projectwallace/css-parser'

export function unquote(str: string): string {
	return str.replaceAll(/(?:^['"])|(?:['"]$)/g, '')
}

/**
 * Case-insensitive compare two character codes
 * @see https://github.com/csstree/csstree/blob/41f276e8862d8223eeaa01a3d113ab70bb13d2d9/lib/tokenizer/utils.js#L22
 */
function compareChar(referenceCode: number, testCode: number): boolean {
	// if uppercase
	if (testCode >= 0x0041 && testCode <= 0x005a) {
		// shifting the 6th bit makes a letter lowercase
		testCode = testCode | 32
	}
	return referenceCode === testCode
}

/**
 * Case-insensitive testing whether a string ends with a given substring
 *
 * @example
 * endsWith('test', 'my-test') // true
 * endsWith('test', 'est') // false
 *
 * @param base e.g. '-webkit-transform'
 * @param maybe e.g. 'transform'
 * @returns true if `test` ends with `base`, false otherwise
 */
export function endsWith(base: string, maybe: string): boolean {
	if (base === maybe) return true

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

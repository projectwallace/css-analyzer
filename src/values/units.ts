// Remove a trailing browserhack escape (`\9`, `\0` or `\7`) from a dimension unit: `px\9` is `px`.
// A unit that is only a hack (`\9`, from `0\9`) becomes ''.
export function strip_unit_hack(unit: string): string {
	const length = unit.length
	if (length >= 2 && unit.charCodeAt(length - 2) === 0x5c /* \ */) {
		const last = unit.charCodeAt(length - 1)
		if (last === 0x39 /* 9 */ || last === 0x30 /* 0 */ || last === 0x37 /* 7 */) {
			return unit.slice(0, -2)
		}
	}
	return unit
}

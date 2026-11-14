/**
 * Remove a trailing browserhack escape (`\9`, `\0` or `\7`) from a dimension unit,
 * e.g. `px\9` -> `px`. A unit that is only a hack (`\9`, from `0\9`) becomes ''.
 */
export function strip_unit_hack(unit: string): string {
	const len = unit.length
	if (len >= 2 && unit.charCodeAt(len - 2) === 0x5c /* \ */) {
		const last = unit.charCodeAt(len - 1)
		if (last === 0x39 /* 9 */ || last === 0x30 /* 0 */ || last === 0x37 /* 7 */) {
			return unit.slice(0, -2)
		}
	}
	return unit
}

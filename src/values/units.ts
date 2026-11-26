import { KeywordSet } from '../utils/collections/keyword-set.ts'

export const length_units: KeywordSet = new KeywordSet([
	'px',
	'em',
	'rem',
	'ex',
	'rex',
	'cap',
	'rcap',
	'ch',
	'rch',
	'ic',
	'ric',
	'lh',
	'rlh',
	'vw',
	'vh',
	'vmin',
	'vmax',
	'svmin',
	'svmax',
	'lvmin',
	'lvmax',
	'dvmin',
	'dvmax',
	'vi',
	'vb',
	'svw',
	'svh',
	'svi',
	'svb',
	'lvw',
	'lvh',
	'lvi',
	'lvb',
	'dvw',
	'dvh',
	'dvi',
	'dvb',
	'cm',
	'mm',
	'q',
	'in',
	'pt',
	'pc',
	'cqw',
	'cqh',
	'cqi',
	'cqb',
	'cqmin',
	'cqmax',
])
export const angle_units: KeywordSet = new KeywordSet(['deg', 'grad', 'rad', 'turn'])
export const time_units: KeywordSet = new KeywordSet(['s', 'ms'])
export const frequency_units: KeywordSet = new KeywordSet(['hz', 'khz'])
export const decibel_units: KeywordSet = new KeywordSet(['db'])
export const semitone_units: KeywordSet = new KeywordSet(['st'])
export const flex_units: KeywordSet = new KeywordSet(['fr'])
export const resolution_units: KeywordSet = new KeywordSet(['dpi', 'dpcm', 'dppx', 'x'])

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

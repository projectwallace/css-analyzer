import { test, expect } from 'vitest'
import {
	decibel_units,
	frequency_units,
	length_units,
	semitone_units,
	strip_unit_hack,
} from './units.ts'

test.each([
	['px\\9', 'px'],
	['px\\0', 'px'],
	['em\\7', 'em'],
	['\\9', ''],
	['px', 'px'],
	['\\70x', '\\70x'],
])('strip_unit_hack("%s") is "%s"', (unit, expected) => {
	expect(strip_unit_hack(unit)).toBe(expected)
})

test.each(['vmin', 'vmax', 'svmin', 'svmax', 'lvmin', 'lvmax', 'dvmin', 'dvmax'])(
	'length_units has %s',
	(unit) => {
		expect(length_units.has(unit)).toBe(true)
	},
)

test.each([
	[frequency_units, 'hz'],
	[frequency_units, 'kHz'],
	[decibel_units, 'dB'],
	[semitone_units, 'st'],
])('unit set has %s', (set, unit) => {
	expect(set.has(unit)).toBe(true)
})

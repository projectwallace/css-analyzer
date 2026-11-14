import { test, expect } from 'vitest'
import { strip_unit_hack } from './units.ts'

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

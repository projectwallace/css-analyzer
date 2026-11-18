import { test, expect } from 'vitest'
import { get_if_functions } from './if-functions.ts'

test('no if() in a plain value', () => {
	expect(get_if_functions('red')).toEqual([])
})

test.each([
	['if(media(width > 1px): 1; else: 2)', 2, true, 0],
	['if(media(width > 1px): 1)', 1, false, 0],
	['if(else: 2)', 1, true, 0],
	['if(else: 2; media(width > 1px): 1)', 2, true, 1],
])('%s has %i branches, else: %s, %i misplaced', (value, branches, has_else, misplaced) => {
	const [found] = get_if_functions(value)
	expect(found).toMatchObject({ branches, has_else })
	expect(found!.misplaced_else).toHaveLength(misplaced)
})

test('finds nested functions, in source order', () => {
	const found = get_if_functions('if(media(width > 1px): if(else: 1); else: 2)')
	expect(found.map((match) => match.branches)).toEqual([2, 1])
})

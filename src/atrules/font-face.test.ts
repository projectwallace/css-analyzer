import { test, expect } from 'vitest'
import { get_font_face_key } from './font-face.ts'

test('get_font_face_key is null without a font-family', () => {
	expect(get_font_face_key({ 'font-weight': '400' })).toBeNull()
})

test('get_font_face_key fills in defaults and normalizes keywords', () => {
	expect(get_font_face_key({ 'font-family': '"Inter"' })).toEqual({
		family: 'Inter',
		weight: '400',
		style: 'normal',
		key: 'inter|400|normal|100%|',
	})
	expect(get_font_face_key({ 'font-family': "'Inter'", 'font-weight': 'BOLD' })?.weight).toBe('700')
})

test('get_font_face_key is the same for the same face', () => {
	const a = get_font_face_key({ 'font-family': 'Inter', 'font-stretch': 'normal' })
	const b = get_font_face_key({ 'font-family': '"inter"', 'font-weight': 'normal' })
	expect(a?.key).toBe(b?.key)
	const c = get_font_face_key({ 'font-family': 'Inter', 'unicode-range': 'U+0000-00FF,  U+0131' })
	const d = get_font_face_key({ 'font-family': 'Inter', 'unicode-range': 'U+0000-00FF,U+0131' })
	expect(c?.key).toBe(d?.key)
	expect(c?.key).not.toBe(a?.key)
})

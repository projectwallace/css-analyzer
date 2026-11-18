import type { Atrule } from '@projectwallace/css-parser'
import { get_atrule_descriptors } from './descriptors.ts'

const weight_keywords: Record<string, string> = { normal: '400', bold: '700' }

export type FontFaceKey = {
	/** Without quotes, as written */
	family: string
	weight: string
	style: string
	/** Family (lowercased), weight, style, stretch and unicode-range: two `@font-face` with the same key are duplicates */
	key: string
}

function lowercase_names(descriptors: Record<string, string>): Record<string, string> {
	const lowercased: Record<string, string> = Object.create(null)
	for (const name of Object.keys(descriptors)) {
		lowercased[name.toLowerCase()] = descriptors[name]!
	}
	return lowercased
}

function normalize(value: string | undefined, fallback: string): string {
	const text = value?.trim().toLowerCase().replaceAll(/\s+/g, ' ')
	return text || fallback
}

/**
 * What makes a `@font-face` unique, from the `@font-face` node or its descriptors (`atrules()` collects them as `font_faces.items`).
 * Defaults are filled in and keywords are numbers: `normal` is `400` and `bold` is `700`.
 * `null` without a `font-family`.
 */
export function get_font_face_key(input: Atrule | Record<string, string>): FontFaceKey | null {
	const lowercased =
		'type_name' in input ? get_atrule_descriptors(input as Atrule) : lowercase_names(input)
	const raw_family = lowercased['font-family']
	if (!raw_family) {
		return null
	}
	const family = raw_family.trim().replaceAll(/(?:^['"])|(?:['"]$)/g, '')
	const weight = normalize(lowercased['font-weight'], '400')
	const style = normalize(lowercased['font-style'], 'normal')
	const stretch = normalize(lowercased['font-stretch'], '100%')
	const range = normalize(lowercased['unicode-range'], '').replaceAll(/\s+/g, '')
	const normalized_weight = weight_keywords[weight] ?? weight
	const normalized_stretch = stretch === 'normal' ? '100%' : stretch
	return {
		family,
		weight: normalized_weight,
		style,
		key: [family.toLowerCase(), normalized_weight, style, normalized_stretch, range].join('|'),
	}
}

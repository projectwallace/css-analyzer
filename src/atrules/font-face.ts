const weight_keywords: Record<string, string> = { normal: '400', bold: '700' }

export type FontFaceKey = {
	/** Without quotes, as written */
	family: string
	weight: string
	style: string
	/** Family (lowercased), weight, style, stretch and unicode-range: two `@font-face` with the same key are duplicates */
	key: string
}

function normalize(value: string | undefined, fallback: string): string {
	const text = value?.trim().toLowerCase().replaceAll(/\s+/g, ' ')
	return text || fallback
}

/**
 * What makes a `@font-face` unique, from its descriptors, with lowercased names.
 * Defaults are filled in and keywords are numbers: `normal` is `400` and `bold` is `700`.
 * `null` without a `font-family`.
 */
export function get_font_face_key(descriptors: Record<string, string>): FontFaceKey | null {
	const raw_family = descriptors['font-family']
	if (!raw_family) {
		return null
	}
	const family = raw_family.trim().replaceAll(/(?:^['"])|(?:['"]$)/g, '')
	const weight = normalize(descriptors['font-weight'], '400')
	const style = normalize(descriptors['font-style'], 'normal')
	const stretch = normalize(descriptors['font-stretch'], '100%')
	const range = normalize(descriptors['unicode-range'], '').replaceAll(/\s+/g, '')
	const normalized_weight = weight_keywords[weight] ?? weight
	const normalized_stretch = stretch === 'normal' ? '100%' : stretch
	return {
		family,
		weight: normalized_weight,
		style,
		key: [family.toLowerCase(), normalized_weight, style, normalized_stretch, range].join('|'),
	}
}

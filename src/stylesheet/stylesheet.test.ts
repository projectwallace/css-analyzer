import { test, expect } from 'vitest'
import { get_embed_type } from './stylesheet.ts'

test('correctly extracts embed types', () => {
	;[
		['test', 'data:test;nothing-to-see-here'],
		['image/gif', 'data:image/gif;base64,R0lGODlhEAAQAMQAAORHHOVS'],
		['image/svg+xml', 'data:image/svg+xml,%3Csvg%20id%3D%22Layer_'],
		['image/svg+xml', 'data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5'],
		['application/font-woff', 'data:application/font-woff;base64,d09GRgAB'],
		['font/opentype', 'data:font/opentype;base64,T1RUTwAJAIAAAw'],
		['image/png', 'data:image/png;base64,iVBORw0KGgoAAAANS'],
		[
			'image/svg+xml',
			`data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28.84 26.6'%3E%3Cdefs%3E%3Cstyle%3E.cls-1%7Bfill:%23e93e32;%7D%3C/style%3E%3C/defs%3E%3Ctitle%3EArtboard 29%3C/title%3E%3Cpath class='cls-1' d='M3.29,2.73a66.7,66.7,0,0,0,3.21,9.52l6.29,1.08L8.1,15.53c2.91,5.28,7,9.09,12.14,4.55L25,24.52l.57-.52-3.83-5.48c3.6-4.32,1.74-7.76-1.93-10.36L17,13.29l-.1-6.85A43.83,43.83,0,0,0,11,4L9,7.7,9,3.39c-2.2-.65-4.07-1.08-5.08-1.3A.52.52,0,0,0,3.29,2.73Z'/%3E%3C/svg%3E`,
		],
		[
			'image/svg+xml',
			`data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28.84 26.6'%3E%3Cdefs%3E%3Cstyle%3E.cls-1%7Bfill:%23e93e32%7D%3C/style%3E%3C/defs%3E%3Crect class='cls-1' x='8.25' y='2.31' width='3.06' height='3.66' rx='1.03' ry='1.03'/%3E%3Crect class='cls-1' x='17.53' y='2.31' width='3.06' height='3.66' rx='1.03' ry='1.03'/%3E%3Cpath class='cls-1' d='M24.1 5.39h-2.56a2 2 0 01-2 1.59h-1a2 2 0 01-2-1.59h-4.28a2 2 0 01-2 1.59h-1a2 2 0 01-2-1.59H4.75a2.07 2.07 0 00-2.08 2.07v14.75a2.07 2.07 0 002.07 2.07H24.1a2.07 2.07 0 002.07-2.07V7.46a2.07 2.07 0 00-2.07-2.07zm-.29 16.15H5.23V8.45h18.58z'/%3E%3Cpath class='cls-1' d='M7.18 11.71h2.5v2.5h-2.5zM11.27 11.71h2.5v2.5h-2.5zM15.26 11.71h2.5v2.5h-2.5zM19.35 11.71h2.5v2.5h-2.5zM7.18 15.78h2.5v2.5h-2.5zM11.27 15.78h2.5v2.5h-2.5zM15.26 15.78h2.5v2.5h-2.5zM19.35 15.78h2.5v2.5h-2.5z'/%3E%3C/svg%3E`,
		],
		[
			'image/svg+xml',
			`data:image/svg+xml,%3Csvg width='9' height='11' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3.55.246c.257-.329.647-.327.903 0l3.36 4.66c.256.329.256.864 0 1.192L4.45 10.75c-.257.329-.644.327-.9 0L.192 6.098c-.256-.329-.256-.865 0-1.192L3.55.246z' fill='%23fff'/%3E%3C/svg%3E`,
		],
	].forEach(([expected, fixture]) => {
		expect(get_embed_type(fixture!)).toBe(expected)
	})
})

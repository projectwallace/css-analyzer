import { test, expect } from 'vitest'
import { parse_value } from '@projectwallace/css-parser/parse-value'
import { get_data_url, get_data_urls } from './data-urls.ts'

test.each([
	['url(data:image/png;base64,AAA)', ['data:image/png;base64,AAA']],
	['url("data:image/svg+xml,<svg/>")', ['data:image/svg+xml,<svg/>']],
	['url(a.png)', []],
	['url(a.png), url(DATA:text/plain,x)', ['DATA:text/plain,x']],
	['red', []],
])('get_data_urls(%j) is %j', (value, expected) => {
	expect(get_data_urls(value).map((match) => match.value)).toEqual(expected)
})

test('get_data_url reads one node', () => {
	const value = parse_value('url(data:a,b) red')
	expect(get_data_url(value.first_child!)).toBe('data:a,b')
	expect(get_data_url(value.first_child!.next_sibling!)).toBeUndefined()
})

test('the match covers the whole url()', () => {
	const value = '1px url(data:a,b)'
	const [match] = get_data_urls(value)
	expect(value.slice(match!.offset, match!.offset + match!.length)).toBe('url(data:a,b)')
})

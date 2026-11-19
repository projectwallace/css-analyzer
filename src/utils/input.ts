import {
	type Selector,
	type SelectorList,
	is_selector,
	is_selector_list,
} from '@projectwallace/css-parser'

function list_to_selectors(list: SelectorList): Selector[] {
	const selectors: Selector[] = []
	list.for_each(function (selector) {
		selectors.push(selector)
	})
	return selectors
}

/** A selector list, or a single selector, as selectors */
export function as_selectors(input: Selector | SelectorList): Selector[] {
	if (is_selector(input)) {
		return [input]
	}
	if (is_selector_list(input)) {
		return list_to_selectors(input)
	}
	throw new TypeError('Passed in source is not a Selector or a SelectorList')
}

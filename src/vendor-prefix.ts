import { is_vendor_prefixed } from '@projectwallace/css-parser'

/**
 * Kept for backwards compatibility
 * @deprecated Will be removed in next major version
 * */
export function hasVendorPrefix(keyword: string): boolean {
	return is_vendor_prefixed(keyword)
}

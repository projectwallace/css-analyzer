/** @param {string} node_type */
export function is_selector(node_type) {
	return node_type.length === 8 && node_type.charCodeAt(0) === 83
}
/** @param {string} node_type */
export function is_atrule(node_type) {
	return node_type.length === 6 && node_type.charCodeAt(0) === 65
}
/** @param {string} node_type */
export function is_rule(node_type) {
	return node_type.length === 4 && node_type.charCodeAt(0) === 82
}
/** @param {string} node_type */
export function is_dimension(node_type) {
	return node_type.length === 9 && node_type.charCodeAt(0) === 68
}
/** @param {string} node_type */
export function is_url(node_type) {
	return node_type.length === 3 && node_type.charCodeAt(0) === 85
}
/** @param {string} node_type */
export function is_value(node_type) {
	return node_type.length === 5 && node_type.charCodeAt(0) === 86
}
/** @param {string} node_type */
export function is_declaration(node_type) {
	return node_type.length === 11 && node_type.charCodeAt(0) === 68
}
/** @param {string} node_type */
export function is_hash(node_type) {
	return node_type.length === 4 && node_type.charCodeAt(0) === 72
}
/** @param {string} node_type */
export function is_identifier(node_type) {
	return node_type.length === 10 && node_type.charCodeAt(0) === 73
}
/** @param {string} node_type */
export function is_function(node_type) {
	return node_type.length === 8 && node_type.charCodeAt(0) === 70
}
/** @param {string} node_type */
export function is_media_query(node_type) {
	return node_type.length === 10 && node_type.charCodeAt(0) === 77
}
/** @param {string} node_type */
export function is_media_feature(node_type) {
	return node_type.length === 12 && node_type.charCodeAt(0) === 77
}
/** @param {string} node_type */
export function is_nth(node_type) {
	return node_type.length === 3 && node_type.charCodeAt(0) === 78
}
/** @param {string} node_type */
export function is_attribute_selector(node_type) {
	return node_type.length === 17 && node_type.charCodeAt(0) === 65
}
/** @param {string} node_type */
export function is_id_selector(node_type) {
	return node_type.length === 10 && node_type.charCodeAt(0) === 73
}
/** @param {string} node_type */
export function is_class_selector(node_type) {
	return node_type.length === 13 && node_type.charCodeAt(0) === 67
}
/** @param {string} node_type */
export function is_pseudo_element_selector(node_type) {
	return node_type.length === 21 && node_type.charCodeAt(0) === 80
}
/** @param {string} node_type */
export function is_type_selector(node_type) {
	return node_type.length === 12 && node_type.charCodeAt(0) === 84
}
/** @param {string} node_type */
export function is_pseudo_class_selector(node_type) {
	return node_type.length === 19 && node_type.charCodeAt(0) === 80
}
/** @param {string} node_type */
export function is_operator(node_type) {
	return node_type.length === 8 && node_type.charCodeAt(0) === 79
}
/** @param {string} node_type */
export function is_string(node_type) {
	return node_type.length === 6 && node_type.charCodeAt(0) === 83
}
/** @param {string} node_type */
export function is_number(node_type) {
	return node_type.length === 6 && node_type.charCodeAt(0) === 76
}
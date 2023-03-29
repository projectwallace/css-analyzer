import { AutoGrowBuffer } from './auto-grow-buffer.js'

const BIT_MASK_8 = 2 ** 8 - 1
const BIT_MASK_16 = 2 ** 16 - 1
const BIT_MASK_24 = 2 ** 24 - 1

export class NodeList {
	constructor() {
		this.cursor = 0
		this.last_offset = 0
		// TODO: replace absolute line/column with lines/columns since
		// previous node, potentially saving a lot of space
		this.linesAndColumns = new AutoGrowBuffer()
		// TODO: replace full offset-since-start with offset-since-previous-node-offset,
		// so this could potentially be Uint16Array instead of Uint32Array
		this.offsetsAndLengths = new AutoGrowBuffer()
	}

	/** @param {import('css-tree').CssNode} node */
	add(node) {
		let loc = node.loc
		if (!loc) return 0

		let start = loc.start
		let end = loc.end.offset

		this.linesAndColumns.push((start.line << 16) + start.column)

		let length = end - start.offset
		this.offsetsAndLengths.push((length << 24) + start.offset)

		this.cursor++

		return this.cursor - 1
	}

	/** @param {number} index */
	at(index) {
		let lineAndColumn = this.linesAndColumns.at(index)
		let line = (lineAndColumn >> 16) & BIT_MASK_16
		let column = lineAndColumn & BIT_MASK_16

		let offsetAndLength = this.offsetsAndLengths.at(index)
		let length = (offsetAndLength >> 24) & BIT_MASK_8
		let offset = offsetAndLength & BIT_MASK_24

		return {
			line,
			column,
			length,
			offset,
		}
	}
}

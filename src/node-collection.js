// @ts-check
class NodeCollection {
  constructor(initial) {
    this.pointer = 0

    if (Number.isFinite(initial)) {
      this.list = new Uint32Array(initial * 4) // items * 4 ints per item
    } else if (Array.isArray(initial)) {
      this.list = new Uint32Array(initial.length * 4)

      for (let index = 0; index < initial.length; index++) {
        this.push(initial[index]);
      }
    }
  }

  push(node) {
    this.list[this.pointer] = node.loc.start.line
    this.pointer++
    this.list[this.pointer] = node.loc.start.column
    this.pointer++
    this.list[this.pointer] = node.loc.end.line
    this.pointer++
    this.list[this.pointer] = node.loc.end.column
    this.pointer++
  }

  size() {
    return this.pointer / 4
  }

  count(stringifyNode) {
    // defer stringification to as late as possible
    const unique = {}

    for (let index = 0; index < this.pointer; index += 4) {
      const element = stringifyNode(this.list[index], this.list[index + 1], this.list[index + 2], this.list[index + 3]);

      if (!unique[element]) {
        unique[element] = 1
      } else {
        unique[element]++
      }
    }
    const total = this.size()
    const totalUnique = Object.keys(unique).length

    return {
      total,
      totalUnique,
      unique,
      uniquenessRatio: total === 0 ? 0 : totalUnique / total,
    }
  }
}

export {
  NodeCollection,
}

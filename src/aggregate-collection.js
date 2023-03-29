/**
 * Find the mode (most occurring value) in an array of Numbers
 * Takes the mean/average of multiple values if multiple values occur the same amount of times.
 *
 * @see https://github.com/angus-c/just/blob/684af9ca0c7808bc78543ec89379b1fdfce502b1/packages/array-mode/index.js
 * @param {Uint16Array} arr - Array to find the mode value for
 * @returns {Number} mode - The `mode` value of `arr`
 */
function Mode(arr) {
  const frequencies = new Map()
  let maxOccurrences = -1
  let maxOccurenceCount = 0
  let sum = 0
  let len = arr.length

  while (len--) {
    const element = arr[len]
    const updatedCount = (frequencies.get(element) || 0) + 1
    frequencies.set(element, updatedCount)

    if (updatedCount > maxOccurrences) {
      maxOccurrences = updatedCount
      maxOccurenceCount = 0
      sum = 0
    }

    if (updatedCount >= maxOccurrences) {
      maxOccurenceCount++
      sum += element
    }
  }

  return sum / maxOccurenceCount
}

/**
 * Find the middle number in an Array of Numbers
 * Returns the average of 2 numbers if the Array length is an even number
 * @see https://github.com/angus-c/just/blob/684af9ca0c7808bc78543ec89379b1fdfce502b1/packages/array-median/index.js
 * @param {Uint16Array} arr - A sorted Array
 * @returns {Number} - The array's Median
 */
function Median(arr) {
  const middle = arr.length / 2
  const lowerMiddleRank = Math.floor(middle)

  if (middle !== lowerMiddleRank) {
    return arr[lowerMiddleRank]
  }
  return (arr[lowerMiddleRank] + arr[lowerMiddleRank - 1]) / 2
}

class AggregateCollection {
  constructor(size = 1024) {
    this._items = new Uint16Array(size)
    this._sum = 0
    this.cursor = 0
  }

  /**
   * Add a new Integer at the end of this AggregateCollection
   * @param {number} item - The item to add
   */
  push(item) {
    this._items[this.cursor] = item
    this._sum += item
    this.cursor++
  }

  size() {
    return this.cursor
  }

  aggregate() {
    if (this.cursor === 0) {
      return {
        min: 0,
        max: 0,
        mean: 0,
        mode: 0,
        median: 0,
        range: 0,
        sum: 0,
      }
    }

    // TODO: can we avoid this sort()? It's slow
    const sorted = this._items.slice(0, this.cursor).sort((a, b) => a - b)
    const min = sorted[0]
    const max = sorted[sorted.length - 1]

    const mode = Mode(sorted)
    const median = Median(sorted)

    return {
      min,
      max,
      mean: this._sum / sorted.length,
      mode,
      median,
      range: max - min,
      sum: this._sum,
    }
  }

  toArray() {
    return Array.from(this._items.slice(0, this.cursor))
  }
}

export {
  AggregateCollection
}
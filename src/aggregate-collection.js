/**
 * Find the mode (most occurring value) in an array of Numbers
 * Takes the mean/average of multiple values if multiple values occur the same amount of times.
 *
 * @see https://github.com/angus-c/just/blob/684af9ca0c7808bc78543ec89379b1fdfce502b1/packages/array-mode/index.js
 * @param {Array} arr - Array to find the mode value for
 * @returns {Number} mode - The `mode` value of `arr`
 */
function Mode(arr) {
  const frequencies = Object.create(null)
  let maxOccurrences = -1
  let maxOccurenceCount = 0
  let sum = 0

  for (let i = 0; i < arr.length; i++) {
    const element = arr[i]
    const updatedCount = (frequencies[element] || 0) + 1
    frequencies[element] = updatedCount

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
 * @param {Array} arr - A sorted Array
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
  constructor(size) {
    /** @type number[] */
    this.items = new Uint8Array(size)
    this.sum = 0
    this.cursor = 0
  }

  /**
   * Add a new Integer at the end of this AggregateCollection
   * @param {number} item - The item to add
   */
  add(item) {
    this.items[this.cursor] = item
    this.sum += item
    this.cursor++
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

    /** @type Number[] */
    // TODO: avoid the sort() by keeping track of min+max in private vars
    const sorted = new Uint8Array(
      this.items.slice(0, this.cursor)
    ).sort((a, b) => a - b)
    const min = sorted[0]
    const max = sorted[sorted.length - 1]

    const mode = Mode(sorted)
    const median = Median(sorted)

    return {
      min,
      max,
      mean: this.sum / this.cursor,
      mode,
      median,
      range: max - min,
      sum: this.sum,
    }
  }

  /**
   * @returns {number[]} All items in this collection
   */
  toArray() {
    return Array.from(
      this.items.subarray(0, this.cursor)
    )
  }
}

export {
  AggregateCollection
}
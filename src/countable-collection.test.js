import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { CountableCollection } from './countable-collection.js'

const CollectionSuite = suite('CountableCollection')

CollectionSuite('counts correctly', () => {
  const fixture = new CountableCollection()
  fixture.push('a')
  fixture.push('a')
  fixture.push('b')
  fixture.push('b')
  fixture.push('c')
  fixture.push('d')
  const actual = fixture.count()
  const expected = {
    total: 6,
    totalUnique: 4,
    unique: {
      a: 2,
      b: 2,
      c: 1,
      d: 1,
    },
    uniquenessRatio: 4 / 6,
  }

  assert.equal(actual, expected)
})

CollectionSuite('handles empty collections correctly', () => {
  const fixture = new CountableCollection()
  const actual = fixture.count()
  const expected = {
    total: 0,
    totalUnique: 0,
    unique: {},
    uniquenessRatio: 0,
  }
  assert.equal(actual, expected)
})

CollectionSuite('accepts an initial collection', () => {
  const fixture = new CountableCollection(['a', 'b'])
  fixture.push('a')
  fixture.push('a')
  fixture.push('b')
  fixture.push('b')
  fixture.push('c')
  fixture.push('d')
  const actual = fixture.count()
  const expected = {
    total: 8,
    totalUnique: 4,
    unique: {
      a: 3,
      b: 3,
      c: 1,
      d: 1,
    },
    uniquenessRatio: 4 / 8,
  }

  assert.equal(actual, expected)
})

CollectionSuite.run()
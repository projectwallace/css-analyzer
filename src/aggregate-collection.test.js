import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { AggregateCollection } from './aggregate-collection.js'

const CollectionSuite = suite('AggregateCollection')

CollectionSuite('aggregates correctly', () => {
  const fixture = new AggregateCollection()
  fixture.push(1)
  fixture.push(2)
  fixture.push(25)
  fixture.push(3)
  fixture.push(4)
  fixture.push(4)
  const actual = fixture.aggregate()
  const expected = {
    max: 25,
    min: 1,
    range: 24,
    mean: 39 / 6,
    median: 3.5,
    mode: 4,
    sum: 39,
  }

  assert.equal(actual, expected)
  assert.equal(fixture.toArray(), [1, 2, 25, 3, 4, 4])
})

CollectionSuite('handles collections without values', () => {
  const fixture = new AggregateCollection()
  const aggregate = fixture.aggregate()
  const items = fixture.toArray()

  assert.equal(aggregate, {
    max: 0,
    min: 0,
    range: 0,
    mean: 0,
    median: 0,
    mode: 0,
    sum: 0,
  })
  assert.equal(items, [])
})

CollectionSuite.run()
const test = require('ava')
const analyze = require('../../../src/analyzer/properties')

test('it responds with the correct structure', t => {
  const actual = analyze([])
  const expected = {
    total: 0,
    totalUnique: 0,
    unique: [],
    browserhacks: {
      total: 0,
      totalUnique: 0,
      unique: []
    },
    prefixed: {
      total: 0,
      totalUnique: 0,
      unique: [],
      share: 0
    }
  }

  t.deepEqual(actual, expected)
})

test('it counts all properties', t => {
  const fixture = [
    {property: 'color', value: 'unset'},
    {property: 'border', value: 'unset'},
    {property: 'font-size', value: 'unset'}
  ]
  const {total: actual} = analyze(fixture)
  const expected = 3

  t.is(actual, expected)
})

test('it lists all unique properties with their count and sorted alphabeticlly', t => {
  const fixture = [
    {property: 'color', value: 'unset'},
    {property: 'color', value: 'unset'},
    {property: 'border', value: 'unset'}
  ]
  const {unique: actual} = analyze(fixture)
  const expected = [{value: 'border', count: 1}, {value: 'color', count: 2}]

  t.deepEqual(actual, expected)
})

test('it counts all unique properties', t => {
  const fixture = [
    {property: 'color', value: 'unset'},
    {property: 'color', value: 'unset'},
    {property: 'border', value: 'unset'}
  ]
  const {totalUnique: actual} = analyze(fixture)
  const expected = 2

  t.is(actual, expected)
})

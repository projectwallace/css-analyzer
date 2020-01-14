const test = require('ava')
const analyze = require('../../../src/analyzer/declarations')

test('it responds with the correct structure', t => {
  const actual = analyze([])
  const expected = {
    total: 0,
    totalUnique: 0,
    importants: {
      total: 0,
      share: 0
    }
  }

  t.deepEqual(actual, expected)
})

test('it counts declarations', t => {
  const fixture = [
    {
      property: 'color',
      value: 'red',
      important: false
    },
    {
      property: 'border',
      value: '1px solid blue',
      important: false
    },
    {
      property: 'font-size',
      value: '16px',
      important: false
    },
    {
      // Duplicate
      property: 'font-size',
      value: '16px',
      important: false
    }
  ]
  const {total, totalUnique} = analyze(fixture)

  t.is(total, 4)
  t.is(totalUnique, 3)
})

test('it ignores !importants when looking for unique declarations', t => {
  const fixture = [
    {
      property: 'font-size',
      value: '16px',
      important: false
    },
    {
      property: 'font-size',
      value: '16px',
      important: true
    }
  ]
  const {totalUnique: actual} = analyze(fixture)

  t.is(actual, 1)
})

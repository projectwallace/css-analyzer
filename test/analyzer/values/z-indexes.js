const test = require('ava')
const analyze = require('../../../src/analyzer/values/z-indexes.js')

test('It responds with the correct structure', t => {
  const actual = analyze([])
  const expected = {
    total: 0,
    unique: [],
    totalUnique: 0
  }

  t.deepEqual(actual, expected)
})

test('It recognizes a z-index correctly', t => {
  const actual = analyze([
    {
      property: 'z-index',
      value: '1'
    }
  ])
  const expected = {
    total: 1,
    unique: [
      {
        value: 1,
        count: 1
      }
    ],
    totalUnique: 1
  }

  t.deepEqual(actual, expected)
})

test('It ignores keywords, and global values', t => {
  const expected = {
    total: 0,
    totalUnique: 0,
    unique: []
  }
  const actual = analyze([
    {
      property: 'z-index',
      value: 'auto'
    },
    {
      property: 'z-index',
      value: 'unset'
    },
    {
      property: 'z-index',
      value: 'initial'
    },
    {
      property: 'z-index',
      value: 'inherit'
    }
  ])

  t.deepEqual(actual, expected)
})

test('It sorts multiple z-indexes correctly, from small to large', t => {
  const expected = {
    total: 4,
    unique: [
      {
        value: -1,
        count: 1
      },
      {
        value: 0,
        count: 1
      },
      {
        value: 2,
        count: 1
      },
      {
        value: 99999,
        count: 1
      }
    ],
    totalUnique: 4
  }
  const actual = analyze([
    {
      property: 'z-index',
      value: '2'
    },
    {
      property: 'z-index',
      value: '99999'
    },
    {
      property: 'z-index',
      value: '0'
    },
    {
      property: 'z-index',
      value: '-1'
    }
  ])

  t.deepEqual(actual, expected)
})

test('It ignores properties that are not z-index', t => {
  const expected = {
    total: 0,
    unique: [],
    totalUnique: 0
  }
  const actual = analyze([
    {
      property: 'line-height',
      value: '1'
    },
    {
      property: 'margin',
      value: '0'
    }
  ])

  t.deepEqual(actual, expected)
})

const test = require('ava')
const analyze = require('../../../src/analyzer/values/box-shadows.js')

// Source: https://developer.mozilla.org/en-US/docs/Learn/CSS/Styling_boxes/Advanced_box_effects
const SIMPLE_BOX_SHADOW = '1px 1px 1px black'
const MULTIPLE_BOX_SHADOWS =
  '1px 1px 1px black,inset 2px 3px 5px rgba(0,0,0,0.3),inset -2px -3px 5px rgba(255,255,255,0.5)'
const INSET_BOX_SHADOW = 'inset -2px -3px 5px rgba(255,255,255,0.5)'

test('It responds with the correct structure', t => {
  const actual = analyze([])
  const expected = {
    total: 0,
    unique: [],
    totalUnique: 0
  }

  t.deepEqual(actual, expected)
})

test('It recognizes a simple/single box-shadow correctly', t => {
  const actual = analyze([
    {
      property: 'box-shadow',
      value: SIMPLE_BOX_SHADOW
    }
  ])
  const expected = {
    total: 1,
    unique: [
      {
        value: SIMPLE_BOX_SHADOW,
        count: 1
      }
    ],
    totalUnique: 1
  }

  t.deepEqual(actual, expected)
})

test('It recognizes box-shadow that uses inset', t => {
  const expected = {
    total: 1,
    totalUnique: 1,
    unique: [
      {
        value: INSET_BOX_SHADOW,
        count: 1
      }
    ]
  }
  const actual = analyze([
    {
      property: 'box-shadow',
      value: INSET_BOX_SHADOW
    }
  ])

  t.deepEqual(actual, expected)
})

test('It recognizes an advanced box-shadow with multiple shadows', t => {
  const expected = {
    total: 1,
    unique: [
      {
        value: MULTIPLE_BOX_SHADOWS,
        count: 1
      }
    ],
    totalUnique: 1
  }
  const actual = analyze([
    {
      property: 'box-shadow',
      value: MULTIPLE_BOX_SHADOWS
    }
  ])

  t.deepEqual(actual, expected)
})

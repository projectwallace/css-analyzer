const test = require('ava')
const analyze = require('../../../src/analyzer/values/animations.js')

test('it responds with the correct structure', t => {
  const actual = analyze([])
  const expected = {
    durations: {
      total: 0,
      unique: [],
      totalUnique: 0
    },
    timingFunctions: {
      total: 0,
      unique: [],
      totalUnique: 0
    }
  }

  t.deepEqual(actual, expected)
})

test('it recognizes simple animation|transition-durations correctly', t => {
  const fixture = [
    {
      property: 'animation-duration',
      value: '1s'
    },
    {
      property: 'animation-duration',
      value: '2ms'
    },
    {
      property: 'animation-duration',
      value: 'inherit'
    },
    {
      property: 'transition-duration',
      value: '1s'
    },
    {
      property: 'transition-duration',
      value: '2ms'
    },
    {
      property: 'transition-duration',
      value: 'inherit'
    }
  ]
  const {durations: actual} = analyze(fixture)
  const expected = {
    total: 4,
    totalUnique: 2,
    unique: [
      {count: 2, value: '2ms'},
      {count: 2, value: '1s'}
    ]
  }
  t.deepEqual(actual, expected)
})

test('it recognizes simple animation|transition-timing-functions correctly', t => {
  const fixture = [
    {
      property: 'animation-timing-function',
      value: 'linear'
    },
    {
      property: 'animation-timing-function',
      value: 'cubic-bezier(0, 1, 0, 1)'
    },
    {
      property: 'animation-timing-function',
      value: 'inherit'
    },
    {
      property: 'transition-timing-function',
      value: 'linear'
    },
    {
      property: 'transition-timing-function',
      value: 'cubic-bezier(0, 1, 0, 1)'
    },
    {
      property: 'transition-timing-function',
      value: 'inherit'
    }
  ]
  const {timingFunctions: actual} = analyze(fixture)
  const expected = {
    total: 4,
    totalUnique: 2,
    unique: [
      {count: 2, value: 'cubic-bezier(0, 1, 0, 1)'},
      {count: 2, value: 'linear'}
    ]
  }
  t.deepEqual(actual, expected)
})

test('it recognizes shorthand animation|transition declarations', t => {
  const fixture = [
    {
      property: 'animation',
      value: '1s ANIMATION_NAME linear'
    },
    {
      property: 'animation',
      value: '2s ANIMATION_NAME cubic-bezier(0, 1, 0, 1) 3s'
    },
    {
      property: 'animation',
      value: 'inherit'
    },
    {
      property: 'transition',
      value: 'all 4s'
    },
    {
      property: 'transition',
      value: 'all 5s cubic-bezier(0, 1, 0, 1)'
    },
    {
      property: 'transition',
      value: 'all 6s cubic-bezier(0, 1, 0, 1) 7s'
    },
    {
      property: 'transition',
      value: 'inherit'
    }
  ]
  const actual = analyze(fixture)
  const expected = {
    durations: {
      total: 5,
      totalUnique: 5,
      unique: [
        {count: 1, value: '1s'},
        {count: 1, value: '2s'},
        {count: 1, value: '4s'},
        {count: 1, value: '5s'},
        {count: 1, value: '6s'}
      ]
    },
    timingFunctions: {
      total: 4,
      totalUnique: 2,
      unique: [
        {count: 3, value: 'cubic-bezier(0, 1, 0, 1)'},
        {count: 1, value: 'linear'}
      ]
    }
  }
  t.deepEqual(actual, expected)
})

test('it recognizes shorthand animations|transitions with multiple values', t => {
  const fixture = [
    {
      property: 'animation',
      value: '1s ANIMATION_NAME linear, 2s ANIMATION_NAME linear'
    },
    {
      property: 'animation',
      value: '3s ANIMATION_NAME ease 4s, 5s ANIMATION_NAME ease-in-out 6s'
    },
    {
      property: 'transition',
      value: 'all 7s, color 8s'
    },
    {
      property: 'transition',
      value: 'all 9s ease, all 10s linear'
    },
    {
      property: 'transition',
      value: 'all 11s steps(4, step-end) 12s, all 13s steps(2) 14s'
    },
    {
      property: 'transition',
      value:
        'all 1ms, color 2ms, font-size 3ms 4ms, line-height 1000ms, border 0.002s'
    }
  ]
  const actual = analyze(fixture)
  const expected = {
    durations: {
      total: 15,
      totalUnique: 15,
      unique: [
        {count: 1, value: '1ms'},
        {count: 1, value: '2ms'},
        {count: 1, value: '0.002s'},
        {count: 1, value: '3ms'},
        {count: 1, value: '1000ms'},
        {count: 1, value: '1s'},
        {count: 1, value: '2s'},
        {count: 1, value: '3s'},
        {count: 1, value: '5s'},
        {count: 1, value: '7s'},
        {count: 1, value: '8s'},
        {count: 1, value: '9s'},
        {count: 1, value: '10s'},
        {count: 1, value: '11s'},
        {count: 1, value: '13s'}
      ]
    },
    timingFunctions: {
      total: 8,
      totalUnique: 5,
      unique: [
        {count: 2, value: 'ease'},
        {count: 1, value: 'ease-in-out'},
        {count: 3, value: 'linear'},
        {count: 1, value: 'steps(2)'},
        {count: 1, value: 'steps(4, step-end)'}
      ]
    }
  }
  t.deepEqual(actual, expected)
})

test('it does not report animations in declarations that are not eligible', t => {
  const actual = analyze([
    {
      property: 'line-height',
      value: '1'
    },
    {
      property: 'margin',
      value: '0'
    },
    {
      property: 'background',
      value: 'red, blue, linear-gradient(green, yellow), url(3ms.gif)'
    }
  ])
  const expected = {
    durations: {
      total: 0,
      unique: [],
      totalUnique: 0
    },
    timingFunctions: {
      total: 0,
      unique: [],
      totalUnique: 0
    }
  }

  t.deepEqual(actual, expected)
})

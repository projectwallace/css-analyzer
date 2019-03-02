const test = require('ava')
const analyze = require('../../../src/analyzer/values/colors.js')

const NO_COLORS = {
  total: 0,
  unique: [],
  totalUnique: 0,
  duplicates: {
    total: 0,
    totalUnique: 0,
    unique: []
  }
}

test('It responds with the correct structure', t => {
  const actual = analyze([])
  const expected = NO_COLORS

  t.deepEqual(actual, expected)
})

test('It ignores global CSS keywords', t => {
  const actual = analyze([
    {
      property: 'color',
      value: 'inherit'
    },
    {
      property: 'color',
      value: 'initial'
    },
    {
      property: 'color',
      value: 'auto'
    },
    {
      property: 'background',
      value: 'none'
    },
    {
      property: 'color',
      value: 'currentColor'
    },
    {
      property: 'color',
      value: 'transparent'
    }
  ])

  const expected = NO_COLORS

  t.deepEqual(actual, expected)
})

test('It finds color keywords', t => {
  const actual = analyze([
    {
      property: 'outline',
      value: '1px solid tomato'
    },
    {
      property: 'border-color',
      value: 'Aqua'
    },
    {
      property: 'outline-color',
      value: 'whitesmoke'
    },
    {
      property: 'background',
      value: 'linear-gradient(90deg, purple 0, purple 100%)'
    }
  ])

  const expected = {
    total: 5,
    totalUnique: 4,
    unique: [
      {
        value: 'tomato',
        count: 1
      },
      {
        value: 'Aqua',
        count: 1
      },
      {
        value: 'purple',
        count: 2
      },
      {
        value: 'whitesmoke',
        count: 1
      }
    ],
    duplicates: {
      total: 0,
      totalUnique: 0,
      unique: []
    }
  }

  t.deepEqual(actual, expected)
})

test('It does not report false positives for color keywords', t => {
  const falsePositives = [
    {
      property: 'background',
      value:
        'url("icon-blue.png"), url("blue-icon.png"), url("blue_icon.png"), url("icon_blue.png")' // Not blue color keyword
    },
    {
      property: 'background-image',
      value: 'url(#footer-logo-text-linear-gradient)' // Not a hex color
    },
    {
      property: 'white-space', // Not white color keyword
      value: 'nowrap'
    },
    {
      property: 'counter-increment',
      value: 'lineNo' // Not linen color keyword
    },
    {
      property: '-moz-osx-font-smoothing',
      value: 'grayscale'
    }
  ]
  const actual = analyze(falsePositives)

  const expected = NO_COLORS

  t.deepEqual(actual, expected)
})

test('It finds hex colors', t => {
  const actual = analyze(
    ['#aff034', '#aaa', '#0000ffaa', '#aaaa'].map(value => ({
      property: 'color',
      value
    }))
  )
  const expected = {
    total: 4,
    unique: [
      {count: 1, value: '#aff034'},
      {count: 1, value: '#0000ffaa'},
      {count: 1, value: '#aaa'},
      {count: 1, value: '#aaaa'}
    ],
    totalUnique: 4,
    duplicates: {
      total: 0,
      totalUnique: 0,
      unique: []
    }
  }

  t.deepEqual(actual, expected)
})

test('It finds RGB(A) colors', t => {
  const actual = analyze(
    [
      'rgb(100, 200, 10)',
      'rgba(100, 200, 10, 0.5)',
      'rgba(100, 200, 11, .5)',
      'rgba(2,2,2,.2)'
    ].map(value => ({
      property: 'color',
      value
    }))
  )
  const expected = {
    total: 4,
    unique: [
      {count: 1, value: 'rgb(100, 200, 10)'},
      {count: 1, value: 'rgba(100, 200, 10, 0.5)'},
      {count: 1, value: 'rgba(100, 200, 11, .5)'},
      {count: 1, value: 'rgba(2,2,2,.2)'}
    ],
    totalUnique: 4,
    duplicates: {
      total: 0,
      totalUnique: 0,
      unique: []
    }
  }

  t.deepEqual(actual, expected)
})

test('It finds HSL(A) colors', t => {
  const actual = analyze(
    ['hsl(100, 20%, 30%)', 'hsla(100, 20%, 30%, 0.5)'].map(value => ({
      property: 'color',
      value
    }))
  )
  const expected = {
    total: 2,
    unique: [
      {count: 1, value: 'hsl(100, 20%, 30%)'},
      {count: 1, value: 'hsla(100, 20%, 30%, 0.5)'}
    ],
    totalUnique: 2,
    duplicates: {
      total: 0,
      totalUnique: 0,
      unique: []
    }
  }

  t.deepEqual(actual, expected)
})

test('It sorts colors', t => {
  const actual = analyze(
    [
      'hsl(0, 100%, 50%)',
      'hsl(270, 100%, 50%)',
      'hsl(180, 100%, 50%)',
      'hsl(90, 100%, 50%)'
    ].map(value => ({property: 'color', value}))
  )
  const expected = {
    total: 4,
    unique: [
      {count: 1, value: 'hsl(0, 100%, 50%)'},
      {count: 1, value: 'hsl(90, 100%, 50%)'},
      {count: 1, value: 'hsl(180, 100%, 50%)'},
      {count: 1, value: 'hsl(270, 100%, 50%)'}
    ],
    totalUnique: 4,
    duplicates: {
      total: 0,
      totalUnique: 0,
      unique: []
    }
  }

  t.deepEqual(actual, expected)
})

test('It finds duplicate colors when written in various notations', t => {
  const actual = analyze(
    [
      '#000',
      '#000000',
      'black',
      'black',
      'rgb(0,0,0)',
      'rgba(0,0,0,1)',
      'hsl(0,0,0)',
      'hsla(0,0,0,1)'
    ].map(value => ({property: 'color', value}))
  )
  const expected = {
    total: 8,
    unique: [
      {value: '#000', count: 1},
      {value: '#000000', count: 1},
      {value: 'black', count: 2},
      {value: 'rgb(0,0,0)', count: 1},
      {value: 'rgba(0,0,0,1)', count: 1},
      {value: 'hsl(0,0,0)', count: 1},
      {value: 'hsla(0,0,0,1)', count: 1}
    ],
    totalUnique: 7,
    duplicates: {
      total: 1,
      totalUnique: 1,
      unique: [
        {
          count: 8,
          value: 'black',
          notations: [
            {value: '#000', count: 1},
            {value: '#000000', count: 1},
            {value: 'black', count: 2},
            {value: 'rgb(0,0,0)', count: 1},
            {value: 'rgba(0,0,0,1)', count: 1},
            {value: 'hsl(0,0,0)', count: 1},
            {value: 'hsla(0,0,0,1)', count: 1}
          ]
        }
      ]
    }
  }

  t.deepEqual(actual, expected)
})

test('It reports fully transparent colors as duplicate', t => {
  const actual = analyze(
    ['rgba(0, 0, 0, 0)', 'rgba(100, 100, 100, 0)', 'hsla(20, 40%, 0, 0)'].map(
      value => ({property: 'color', value})
    )
  )
  const expected = {
    total: 3,
    unique: [
      {value: 'hsla(20, 40%, 0, 0)', count: 1},
      {value: 'rgba(0, 0, 0, 0)', count: 1},
      {value: 'rgba(100, 100, 100, 0)', count: 1}
    ],
    totalUnique: 3,
    duplicates: {
      total: 1,
      totalUnique: 1,
      unique: [
        {
          count: 3,
          value: 'rgba(0, 0, 0, 0)',
          notations: [
            {value: 'hsla(20, 40%, 0, 0)', count: 1},
            {value: 'rgba(0, 0, 0, 0)', count: 1},
            {value: 'rgba(100, 100, 100, 0)', count: 1}
          ]
        }
      ]
    }
  }

  t.deepEqual(actual, expected)
})

test('It does not falsely report almost-duplicate colors', t => {
  const actual = analyze(
    ['#dadada', '#d9d9d9'].map(value => ({property: 'color', value}))
  )
  const expected = {
    total: 2,
    unique: [{value: '#dadada', count: 1}, {value: '#d9d9d9', count: 1}],
    totalUnique: 2,
    duplicates: {
      total: 0,
      totalUnique: 0,
      unique: []
    }
  }

  t.deepEqual(actual, expected)
})

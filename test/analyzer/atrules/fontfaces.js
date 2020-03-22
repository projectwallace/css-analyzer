const test = require('ava')
const analyze = require('../../../src/analyzer/atrules/fontfaces')

const FIXTURE = [
  {
    type: 'font-face',
    declarations: [
      {property: 'font-family', value: 'Arial'},
      {property: 'src', value: 'url("http://path.to/arial.woff")'}
    ]
  },
  {
    type: 'font-face',
    declarations: [
      {property: 'font-display', value: 'swap'},
      {property: 'font-family', value: 'monospace'},
      {property: 'font-stretch', value: 'condensed'},
      {property: 'font-style', value: 'italic'},
      {property: 'font-weight', value: 'bold'},
      {
        property: 'font-variant',
        value: 'no-common-ligatures proportional-nums'
      },
      {property: 'font-feature-settings', value: '"liga" 0'},
      {property: 'font-variation-settings', value: '"xhgt" 0.7'},
      {property: 'src', value: 'local("Input Mono")'},
      {property: 'unicode-range', value: 'U+0025-00FF'}
    ]
  },
  {
    type: 'font-face',
    declarations: [
      {property: 'font-family', value: '"Input Mono"'},
      {
        property: 'src',
        value: 'local("Input Mono") url("path/to/input_mono.ttf")'
      }
    ]
  },
  {
    type: 'font-face',
    declarations: [
      {property: 'font-family', value: 'MyHelvetica'},
      {
        property: 'src',
        value:
          'local("Helvetica Neue Bold"), local("HelveticaNeue-Bold"), url(MgOpenModernaBold.ttf)'
      },
      {property: 'font-weight', value: 'bold'}
    ]
  }
]

test('it responds with the correct structure', t => [
  t.deepEqual(analyze([]), {
    total: 0,
    totalUnique: 0,
    unique: []
  })
])

test('it counts @font-faces', t => {
  const {total: actual} = analyze(FIXTURE)

  t.is(actual, 4)
})

test('it finds all unique @font-faces and counts and sorts them', t => {
  const {unique: actual} = analyze(FIXTURE)

  t.deepEqual(actual, [
    {
      count: 1,
      value: [
        {property: 'font-family', value: 'MyHelvetica'},
        {
          property: 'src',
          value:
            'local("Helvetica Neue Bold"), local("HelveticaNeue-Bold"), url(MgOpenModernaBold.ttf)'
        },
        {property: 'font-weight', value: 'bold'}
      ]
    },
    {
      count: 1,
      value: [
        {property: 'font-display', value: 'swap'},
        {property: 'font-family', value: 'monospace'},
        {property: 'font-stretch', value: 'condensed'},
        {property: 'font-style', value: 'italic'},
        {property: 'font-weight', value: 'bold'},
        {
          property: 'font-variant',
          value: 'no-common-ligatures proportional-nums'
        },
        {property: 'font-feature-settings', value: '"liga" 0'},
        {property: 'font-variation-settings', value: '"xhgt" 0.7'},
        {property: 'src', value: 'local("Input Mono")'},
        {property: 'unicode-range', value: 'U+0025-00FF'}
      ]
    },
    {
      count: 1,
      value: [
        {property: 'font-family', value: '"Input Mono"'},
        {
          property: 'src',
          value: 'local("Input Mono") url("path/to/input_mono.ttf")'
        }
      ]
    },
    {
      count: 1,
      value: [
        {property: 'font-family', value: 'Arial'},
        {property: 'src', value: 'url("http://path.to/arial.woff")'}
      ]
    }
  ])
})

test('it counts unique @font-faces', t => {
  const {totalUnique: actual} = analyze(FIXTURE)

  t.is(actual, 4)
})

test('it does not report non-font-face atrules as @font-face', t => {
  const actual = analyze([
    {
      type: 'media',
      params: 'X'
    },
    {
      type: 'document',
      params: 'X'
    }
  ])

  t.deepEqual(actual, {
    total: 0,
    totalUnique: 0,
    unique: []
  })
})

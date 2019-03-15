const test = require('ava')
const analyze = require('../../../src/analyzer/atrules/fontfaces')

const FIXTURE = [
  {
    type: 'font-face',
    descriptors: {
      'font-family': 'Arial',
      src: 'url("http://path.to/arial.woff")'
    }
  },
  {
    type: 'font-face',
    descriptors: {
      'font-display': 'swap',
      'font-family': 'monospace',
      'font-stretch': 'condensed',
      'font-style': 'italic',
      'font-weight': 'bold',
      'font-variant': 'no-common-ligatures proportional-nums',
      'font-feature-settings': '"liga" 0',
      'font-variation-settings': '"xhgt" 0.7',
      src: 'local("Input Mono")',
      'unicode-range': 'U+0025-00FF'
    }
  },
  {
    type: 'font-face',
    descriptors: {
      'font-family': '"Input Mono"',
      src: 'local("Input Mono") url("path/to/input_mono.ttf")'
    }
  },
  {
    type: 'font-face',
    descriptors: {
      'font-family': 'MyHelvetica',
      src:
        'local("Helvetica Neue Bold"), local("HelveticaNeue-Bold"), url(MgOpenModernaBold.ttf)',
      'font-weight': 'bold'
    }
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
      value: {
        'font-family': 'MyHelvetica',
        src:
          'local("Helvetica Neue Bold"), local("HelveticaNeue-Bold"), url(MgOpenModernaBold.ttf)',
        'font-weight': 'bold'
      }
    },
    {
      count: 1,
      value: {
        'font-display': 'swap',
        'font-family': 'monospace',
        'font-stretch': 'condensed',
        'font-style': 'italic',
        'font-weight': 'bold',
        'font-variant': 'no-common-ligatures proportional-nums',
        'font-feature-settings': '"liga" 0',
        'font-variation-settings': '"xhgt" 0.7',
        src: 'local("Input Mono")',
        'unicode-range': 'U+0025-00FF'
      }
    },
    {
      count: 1,
      value: {
        'font-family': '"Input Mono"',
        src: 'local("Input Mono") url("path/to/input_mono.ttf")'
      }
    },
    {
      count: 1,
      value: {
        'font-family': 'Arial',
        src: 'url("http://path.to/arial.woff")'
      }
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

const test = require('ava')
const analyze = require('../../../src/analyzer/selectors/specificity')

test('it responds with the correct structure', t => {
  const fixture = []
  const actual = analyze(fixture)

  t.deepEqual(actual, {
    top: [],
    max: {
      value: null,
      count: 0,
      selectors: []
    }
  })
})

test('it finds the max specificity selectors', t => {
  const fixture = [
    'a',
    'a b',
    'a b c',
    '#a .b c', // <- Max.
    'a .b #c', // <- Max.
    'a .b #c' // <- Max. (dupe)
  ]
  const {max: actual} = analyze(fixture)
  const expected = {
    count: 2,
    value: {a: 0, b: 1, c: 1, d: 1},
    selectors: [
      {count: 1, value: '#a .b c', specificity: {a: 0, b: 1, c: 1, d: 1}},
      {count: 2, value: 'a .b #c', specificity: {a: 0, b: 1, c: 1, d: 1}}
    ]
  }

  t.deepEqual(actual, expected)
})

test('it finds the top 5 specificity selectors and sorts them by specificity', t => {
  const fixture = [
    'a10',
    '.Foo > .Bar ~ .Baz [type="text"] + span:before #bazz #fizz #buzz #brick #house',
    'a1',
    'b',
    '.a .b .c .d .e .f .g .h .i .j .k .l .m .n .o .p .q .r .s .t .u .v .w .x .y .z',
    'a'
  ]
  const {top: actual} = analyze(fixture)
  const expected = [
    {
      value:
        '.Foo > .Bar ~ .Baz [type="text"] + span:before #bazz #fizz #buzz #brick #house',
      specificity: {a: 0, b: 5, c: 4, d: 2},
      count: 1
    },
    {
      value:
        '.a .b .c .d .e .f .g .h .i .j .k .l .m .n .o .p .q .r .s .t .u .v .w .x .y .z',
      specificity: {a: 0, b: 0, c: 26, d: 0},
      count: 1
    },
    {
      value: 'a',
      specificity: {a: 0, b: 0, c: 0, d: 1},
      count: 1
    },
    {
      value: 'a1',
      specificity: {a: 0, b: 0, c: 0, d: 1},
      count: 1
    },
    {
      value: 'a10',
      specificity: {a: 0, b: 0, c: 0, d: 1},
      count: 1
    }
  ]

  t.deepEqual(actual, expected)
  t.is(actual.length, 5)
})

const test = require('ava')
const analyze = require('../../../src/analyzer/stylesheets/lines-of-code')

const EMPTY_FIXTURE = {
  rawCss: '',
  atRules: [],
  selectors: [],
  declarations: []
}

test('it counts lines of code', t => {
  t.is(1, analyze(EMPTY_FIXTURE).total)
  t.is(1, analyze({...EMPTY_FIXTURE, rawCss: 'foo{}'}).total)
  t.is(1, analyze({...EMPTY_FIXTURE, rawCss: 'a { color: red; }'}).total)
  t.is(
    3,
    analyze({
      ...EMPTY_FIXTURE,
      rawCss: `a {
        color: red;
      }`
    }).total
  )
  t.is(
    7,
    analyze({
      ...EMPTY_FIXTURE,
      rawCss: `a {
        color: red;
      }

      b {
        color: green;
      }`
    }).total
  )

  t.is(
    11,
    analyze({
      ...EMPTY_FIXTURE,
      rawCss: `/**
        * 3 comment lines
        */

      a {
        color: red;
      }

      b {
        color: green;
      }`
    }).total
  )
})

test('it counts source lines of code', t => {
  t.is(0, analyze(EMPTY_FIXTURE).sourceLinesOfCode.total)
  t.is(
    1,
    analyze({...EMPTY_FIXTURE, selectors: ['foo']}).sourceLinesOfCode.total
  )
  t.is(
    4,
    analyze({
      ...EMPTY_FIXTURE,
      atRules: [
        {
          type: 'media',
          params: '(min-width: 1em)'
        }
      ],
      selectors: ['.selector', '#selector'],
      declarations: [
        {
          property: 'color',
          value: 'red'
        }
      ]
    }).sourceLinesOfCode.total
  )
})

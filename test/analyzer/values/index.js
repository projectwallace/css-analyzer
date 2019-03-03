const test = require('ava')
const analyze = require('../../../src/analyzer/values')

test('It responds with the correct structure', t => {
  const {
    total,
    boxshadows,
    browserhacks,
    colors,
    fontfamilies,
    fontsizes,
    prefixed,
    zindexes
  } = analyze([{property: 'a', value: '0'}])

  t.is(total, 1)
  t.truthy(boxshadows)
  t.truthy(browserhacks)
  t.truthy(colors)
  t.truthy(fontfamilies)
  t.truthy(fontsizes)
  t.truthy(prefixed)
  t.truthy(zindexes)
})

test('It analyzes values with comments', t => {
  t.is(analyze([{property: 'a', value: 'a/* comment */'}]).total, 1)
})

test('It analyzes values with custom properties', t => {
  const fixture = [{property: 'height', value: 'var(--my-custom-property)'}]
  t.notThrows(() => analyze(fixture))
  t.is(analyze(fixture).total, 1)
})

test('It analyzes complex values', t => {
  const fixtures = [
    {property: 'grid-column', value: '1/-1'},
    {property: 'grid-column', value: '1 /-1'},
    {property: 'grid-column', value: '1/ -1'},
    {property: 'grid-column', value: '1 / -1'},
    {property: 'width', value: 'calc(100px + 2%)'}
  ]

  fixtures.forEach(fixture => {
    t.notThrows(() => analyze([fixture]))
    t.is(analyze([fixture]).total, 1)
  })
})

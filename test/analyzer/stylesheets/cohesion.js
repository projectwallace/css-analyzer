const test = require('ava')
const analyze = require('../../../src/analyzer/stylesheets/cohesion')

test('it calculates average cohesion based on the ratio of total declarations and total rules', t => {
  const actual = analyze([
    {
      declarations: [
        {property: 'a', value: 'a'},
        {property: 'b', value: 'b'},
        {property: 'c', value: 'c'},
        {property: 'd', value: 'd'}
      ]
    },
    {
      declarations: [{property: 'a', value: 'a'}, {property: 'b', value: 'b'}]
    }
  ])
  t.is(actual.average, 3)
})

test('it calculates average cohesion correctly if there are no rules and/or declarations', t => {
  const actual = analyze([])
  t.is(actual.average, 0)
})

test('it calculates lowest cohesion as the rule with the most declarations', t => {
  const ruleWithManyDeclarations = {
    selectors: ['test'],
    declarations: [
      {property: 'a', value: 'a'},
      {property: 'b', value: 'b'},
      {property: 'c', value: 'c'},
      {property: 'd', value: 'd'}
    ]
  }
  const fixture = [
    ruleWithManyDeclarations,
    {
      declarations: [{property: 'a', value: 'a'}]
    }
  ]
  const actual = analyze(fixture)

  t.is(actual.min.count, 4)
  t.deepEqual(actual.min.value, ruleWithManyDeclarations)
})

test('it calculates lowest cohesion correctly if there are no declarations', t => {
  const actualWithNoRules = analyze([])
  t.is(actualWithNoRules.min.count, 0)
  t.is(actualWithNoRules.min.value, null)

  const actualWithNoDeclarations = analyze([
    {
      selectors: ['a'],
      declarations: []
    }
  ])
  t.is(actualWithNoDeclarations.min.count, 0)
  t.is(actualWithNoDeclarations.min.value, null)
})

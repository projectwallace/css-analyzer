const test = require('ava')
const analyze = require('../../')

const fixture = `
	rule1,
	selector1 { }

	rule2,
	selector2 {
		property: value;
	}

	@media (min-width: 240px) {
		rule3 {
			property: value;
		}
	}

	@supports (property) {
		rule4 {
			property: value;
		}

		@media (min-width: 320px) {
			rule5 {
				property1: value;
				property2: value;
				property3: value;
			}
		}
	}
`

let actual

test.beforeEach(() => {
	actual = analyze(fixture)
})

test('it counts all rules', (t) => {
	t.is(actual['rules.total'].value, 5)
})

test('it counts empty rules', (t) => {
	t.is(actual['rules.empty.total'].value, 1)
	t.is(actual['rules.empty.ratio'].value, 1 / 5)
})

test('it counts the average # of selectors per rule', (t) => {
	t.is(actual['rules.selectors.average'].value, 7 / 5)
})

test('it finds the rules with the most declarations', (t) => {
	t.is(actual['rules.declarations.maximum.total'].value, 3)
	t.deepEqual(actual['rules.declarations.maximum.declarations'].value, [
		{
			selectors: [{ value: 'rule5' }],
			declarations: [
				{
					isImportant: false,
					property: { name: 'property1' },
					value: { value: 'value' },
				},
				{
					isImportant: false,
					property: { name: 'property2' },
					value: { value: 'value' },
				},
				{
					isImportant: false,
					property: { name: 'property3' },
					value: { value: 'value' },
				},
			],
		},
	])
})

test('it finds the rules with the most selectors', (t) => {
	t.is(actual['rules.selectors.maximum.total'].value, 2)
	t.deepEqual(actual['rules.selectors.maximum.selectors'].value, [
		{
			selectors: [{ value: 'rule1' }, { value: 'selector1' }],
			declarations: [],
		},
		{
			selectors: [{ value: 'rule2' }, { value: 'selector2' }],
			declarations: [
				{
					isImportant: false,
					property: {
						name: 'property',
					},
					value: {
						value: 'value',
					},
				},
			],
		},
	])
})

test('it counts the average # of declarations per rule', (t) => {
	t.is(actual['rules.declarations.average'].value, 6 / 5)
})

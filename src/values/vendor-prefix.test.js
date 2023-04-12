import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { analyze } from '../index.js'

const VendorPrefix = suite('VendorPrefixedValue')

VendorPrefix('finds simple prefixes', () => {
  const fixture = `
    value-vendor-prefix-simple {
      width: -moz-max-content;
      width: -webkit-max-content;
      box-shadow: 0 0 0 3px -moz-mac-focusring;
      position: -webkit-sticky;
      -webkit-transition: -webkit-transform 0.3s ease-out;
      -moz-transition: -moz-transform 0.3s ease-out;
      -o-transition: -o-transform 0.3s ease-out;
    }

    not-a-prefix {
      background: var(--test);
      margin: -0.3em;
    }

    @supports (position: -webkit-sticky) {
      thing {
        position: -webkit-sticky;
        position: sticky;
      }
    }
  `
  const actual = analyze(fixture).values.prefixes
  const expected = {
    total: 8,
    totalUnique: 7,
    unique: {
      '-moz-max-content': 1,
      '-webkit-max-content': 1,
      '0 0 0 3px -moz-mac-focusring': 1,
      '-webkit-sticky': 2,
      '-webkit-transform 0.3s ease-out': 1,
      '-moz-transform 0.3s ease-out': 1,
      '-o-transform 0.3s ease-out': 1,
    },
    uniquenessRatio: 7 / 8
  }

  assert.equal(actual, expected)
})

VendorPrefix('finds nested prefixes', () => {
  const fixture = `
    value-vendor-prefix-nested {
      background-image: -khtml-linear-gradient(90deg, red, green);
      background:
        red,
        -webkit-linear-gradient(transparent, transparent),
        -moz-linear-gradient(transparent, transparent),
        -ms-linear-gradient(transparent, transparent),
        -o-linear-gradient(transparent, transparent);
      grid-template-columns: repeat(3, max(-webkit-max-content, 100vw));
    }
  `
  const actual = analyze(fixture).values.prefixes
  const expected = {
    total: 3,
    totalUnique: 3,
    unique: {
      '-khtml-linear-gradient(90deg, red, green)': 1,
      'red,\n        -webkit-linear-gradient(transparent, transparent),\n        -moz-linear-gradient(transparent, transparent),\n        -ms-linear-gradient(transparent, transparent),\n        -o-linear-gradient(transparent, transparent)': 1,
      'repeat(3, max(-webkit-max-content, 100vw))': 1,
    },
    uniquenessRatio: 1
  }

  assert.equal(actual, expected)
})

VendorPrefix.skip('finds DEEPLY nested prefixes', () => {
  const fixture = `
    value-vendor-prefix-deeply-nested {
      width: var(--test, -webkit-max-content);
    }
  `
  const actual = analyze(fixture).values.prefixes
  const expected = {
    total: 1,
    totalUnique: 1,
    unique: {
      'var(--test, -webkit-max-content)': 1,
    },
    uniquenessRatio: 1
  }

  assert.equal(actual, expected)
})

VendorPrefix.run()
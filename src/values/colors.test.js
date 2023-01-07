import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { analyze } from '../index.js'

const Colors = suite('Colors')

Colors('finds hex colors', () => {
  const actual = analyze(`
    test {
      color: #000;
      color: #1111;
      color: #222222;
      color: #33333333;
    }

    test-bg {
      background: linear-gradient(90deg, #444 0, #444 100%);
    }

    test-box-shadow {
      box-shadow: 0 0 0 #555;
    }

    test-outline-color {
      outline-color: #666;
    }

    test-custom-property {
      test: #777;
    }

    test-hex-casing {
      casing: #AaBbCc;
    }

    #not-a-color {
      margin: 0;
    }
  `).values.colors;

  const expected = {
    total: 10,
    totalUnique: 9,
    unique: {
      '#000': 1,
      '#1111': 1,
      '#222222': 1,
      '#33333333': 1,
      '#444': 2,
      '#555': 1,
      '#666': 1,
      '#777': 1,
      '#AaBbCc': 1,
    },
    uniquenessRatio: 9 / 10,
    itemsPerContext: {
      color: {
        total: 4,
        totalUnique: 4,
        uniquenessRatio: 1,
        unique: {
          '#000': 1,
          '#1111': 1,
          '#222222': 1,
          '#33333333': 1,
        },
      },
      background: {
        total: 2,
        totalUnique: 1,
        uniquenessRatio: 1 / 2,
        unique: {
          '#444': 2,
        },
      },
      'box-shadow': {
        total: 1,
        totalUnique: 1,
        uniquenessRatio: 1,
        unique: {
          '#555': 1,
        },
      },
      'outline-color': {
        total: 1,
        totalUnique: 1,
        uniquenessRatio: 1,
        unique: {
          '#666': 1,
        }
      },
      'test': {
        total: 1,
        totalUnique: 1,
        uniquenessRatio: 1,
        unique: {
          '#777': 1,
        },
      },
      'casing': {
        total: 1,
        totalUnique: 1,
        uniquenessRatio: 1,
        unique: {
          '#AaBbCc': 1,
        },
      },
    },
    formats: {
      "total": 10,
      "totalUnique": 4,
      "unique": {
        hex3: 6,
        hex4: 1,
        hex6: 2,
        hex8: 1,
      },
      "uniquenessRatio": 4 / 10,
    }
  }
  assert.equal(actual, expected)
})

Colors('Counts hex format correctly when combined with a browserhack', () => {
  let actual = analyze(`
    a {
      color: #000\\9;
    }
  `)
  let expected = {
    total: 1,
    totalUnique: 1,
    unique: {
      '#000\\9': 1,
    },
    uniquenessRatio: 1,
    itemsPerContext: {
      color: {
        total: 1,
        totalUnique: 1,
        uniquenessRatio: 1,
        unique: {
          '#000\\9': 1,
        },
      },
    },
    formats: {
      total: 1,
      totalUnique: 1,
      unique: {
        hex3: 1,
      },
      uniquenessRatio: 1,
    }
  }
  assert.equal(actual.values.colors, expected);
})

Colors('finds hsl(a) colors', () => {
  const actual = analyze(`
    test {
      color: hsl(1, 20%, 30%);
      color: hsl(1 20% 30% / 1);
      color: Hsla(2, 20%, 30%, 0.5);
    }

    test-bg {
      background: linear-gradient(90deg, hsl(3, 20%, 30%) 0, hsl(3, 20%, 30%) 100%);
    }

    test-box-shadow {
      box-shadow: 0 0 0 hsl(4, 20%, 30%);
    }

    test-outline-color {
      outline-color: hsl(5, 20%, 30%);
    }

    test-custom-property {
      test: hsl(6, 20%, 30%);
    }

    test-notations {
      color: hsl(30, 100%, 50%, 0.6);
      color: hsla(30, 100%, 50%, 0.6);
      color: hsl(30 100% 50% / 0.6);
      color: hsla(30 100% 50% / 0.6);
      color: hsl(30.0 100% 50% / 60%);
      color: hsla(30.2 100% 50% / 60%);

      /* Source: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#hsl_syntax_variations */
      /* These examples all specify the same color: a lavender. */
      color: hsl(270,60%,70%);
      color: hsl(270, 60%, 70%);
      color: hsl(270 60% 70%);
      color: hsl(270deg, 60%, 70%);
      color: hsl(4.71239rad, 60%, 70%);
      color: hsl(.75turn, 60%, 70%);

      /* These examples all specify the same color: a lavender that is 15% opaque. */
      color: hsl(270, 60%, 50%, .15);
      color: hsl(270, 60%, 50%, 15%);
      color: hsl(270 60% 50% / .15);
      color: hsl(270 60% 50% / 15%);
    }
  `).values.colors;

  const expected = {
    total: 24,
    totalUnique: 23,
    unique: {
      'hsl(1, 20%, 30%)': 1,
      'hsl(1 20% 30% / 1)': 1,
      'Hsla(2, 20%, 30%, 0.5)': 1,
      'hsl(3, 20%, 30%)': 2,
      'hsl(4, 20%, 30%)': 1,
      'hsl(5, 20%, 30%)': 1,
      'hsl(6, 20%, 30%)': 1,
      'hsl(30, 100%, 50%, 0.6)': 1,
      'hsla(30, 100%, 50%, 0.6)': 1,
      'hsl(30 100% 50% / 0.6)': 1,
      'hsla(30 100% 50% / 0.6)': 1,
      'hsl(30.0 100% 50% / 60%)': 1,
      'hsla(30.2 100% 50% / 60%)': 1,
      'hsl(270,60%,70%)': 1,
      'hsl(270, 60%, 70%)': 1,
      'hsl(270 60% 70%)': 1,
      'hsl(270deg, 60%, 70%)': 1,
      'hsl(4.71239rad, 60%, 70%)': 1,
      'hsl(.75turn, 60%, 70%)': 1,
      'hsl(270, 60%, 50%, .15)': 1,
      'hsl(270, 60%, 50%, 15%)': 1,
      'hsl(270 60% 50% / .15)': 1,
      'hsl(270 60% 50% / 15%)': 1,
    },
    uniquenessRatio: 23 / 24,
    itemsPerContext: {
      color: {
        total: 19,
        totalUnique: 19,
        unique: {
          'hsl(1, 20%, 30%)': 1,
          'hsl(1 20% 30% / 1)': 1,
          'Hsla(2, 20%, 30%, 0.5)': 1,
          'hsl(30, 100%, 50%, 0.6)': 1,
          'hsla(30, 100%, 50%, 0.6)': 1,
          'hsl(30 100% 50% / 0.6)': 1,
          'hsla(30 100% 50% / 0.6)': 1,
          'hsl(30.0 100% 50% / 60%)': 1,
          'hsla(30.2 100% 50% / 60%)': 1,
          'hsl(270,60%,70%)': 1,
          'hsl(270, 60%, 70%)': 1,
          'hsl(270 60% 70%)': 1,
          'hsl(270deg, 60%, 70%)': 1,
          'hsl(4.71239rad, 60%, 70%)': 1,
          'hsl(.75turn, 60%, 70%)': 1,
          'hsl(270, 60%, 50%, .15)': 1,
          'hsl(270, 60%, 50%, 15%)': 1,
          'hsl(270 60% 50% / .15)': 1,
          'hsl(270 60% 50% / 15%)': 1,
        },
        uniquenessRatio: 1,
      },
      background: {
        total: 2,
        totalUnique: 1,
        unique: {
          'hsl(3, 20%, 30%)': 2
        },
        uniquenessRatio: 0.5
      },
      'box-shadow': {
        total: 1,
        totalUnique: 1,
        unique: {
          'hsl(4, 20%, 30%)': 1
        },
        uniquenessRatio: 1
      },
      'outline-color': {
        total: 1,
        totalUnique: 1,
        unique: {
          'hsl(5, 20%, 30%)': 1
        },
        uniquenessRatio: 1
      },
      'test': {
        total: 1,
        totalUnique: 1,
        unique: {
          'hsl(6, 20%, 30%)': 1
        },
        uniquenessRatio: 1
      }
    },
    formats: {
      total: 24,
      totalUnique: 2,
      unique: {
        hsl: 20,
        hsla: 4,
      },
      uniquenessRatio: 2 / 24,
    },
  }
  assert.equal(actual, expected)
})

Colors('finds rgb(a) colors', () => {
  const actual = analyze(`
    test {
      color: rgb(1, 1, 1);
      color: rgba(2, 2, 2, 0.2);
      color: RGBA(3, 3, 3, .3);
      color: rgba(4,4,4,.4)
    }

    test-bg {
      background: linear-gradient(90deg, rgb(5, 5, 5) 0, rgb(5, 5, 5) 100%);
    }

    test-box-shadow {
      box-shadow: 0 0 0 rgb(6,6,6);
    }

    test-outline-color {
      outline-color: rgb(7,7,7);
    }

    test-custom-property {
      test: rgb(8,8,8);
    }

    /* Source: https://developer.mozilla.org/en-US/docs/Web/CSS/color */
    test-notations {
      color: rgb(34, 12, 64, 0.6);
      color: rgba(34, 12, 64, 0.6);
      color: rgb(34 12 64 / 0.6);
      color: rgba(34 12 64 / 0.3);
      color: rgb(34.0 12 64 / 60%);
      color: rgba(34.6 12 64 / 30%);
      color: rgba(255, 0, 153.6, 1);
    }

    /* https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#rgb_transparency_variations */
    test-exotic-numbers {
      color: rgba(1e2, .5e1, .5e0, +.25e2%);
    }
  `).values.colors;

  const expected = {
    total: 17,
    totalUnique: 16,
    unique: {
      'rgb(1, 1, 1)': 1,
      'rgba(2, 2, 2, 0.2)': 1,
      'RGBA(3, 3, 3, .3)': 1,
      'rgba(4,4,4,.4)': 1,
      'rgb(5, 5, 5)': 2,
      'rgb(6,6,6)': 1,
      'rgb(7,7,7)': 1,
      'rgb(8,8,8)': 1,
      'rgb(34, 12, 64, 0.6)': 1,
      'rgba(34, 12, 64, 0.6)': 1,
      'rgb(34 12 64 / 0.6)': 1,
      'rgba(34 12 64 / 0.3)': 1,
      'rgb(34.0 12 64 / 60%)': 1,
      'rgba(34.6 12 64 / 30%)': 1,
      'rgba(255, 0, 153.6, 1)': 1,
      'rgba(1e2, .5e1, .5e0, +.25e2%)': 1,
    },
    uniquenessRatio: 16 / 17,
    itemsPerContext: {
      color: {
        total: 12,
        totalUnique: 12,
        unique: {
          'rgb(1, 1, 1)': 1,
          'rgba(2, 2, 2, 0.2)': 1,
          'RGBA(3, 3, 3, .3)': 1,
          'rgba(4,4,4,.4)': 1,
          'rgb(34, 12, 64, 0.6)': 1,
          'rgba(34, 12, 64, 0.6)': 1,
          'rgb(34 12 64 / 0.6)': 1,
          'rgba(34 12 64 / 0.3)': 1,
          'rgb(34.0 12 64 / 60%)': 1,
          'rgba(34.6 12 64 / 30%)': 1,
          'rgba(255, 0, 153.6, 1)': 1,
          'rgba(1e2, .5e1, .5e0, +.25e2%)': 1
        },
        uniquenessRatio: 1,
      },
      background: {
        total: 2,
        totalUnique: 1,
        unique: {
          'rgb(5, 5, 5)': 2
        },
        uniquenessRatio: 0.5,
      },
      'box-shadow': {
        total: 1,
        totalUnique: 1,
        unique: {
          'rgb(6,6,6)': 1
        },
        uniquenessRatio: 1,
      },
      'outline-color': {
        total: 1,
        totalUnique: 1,
        unique: {
          'rgb(7,7,7)': 1
        },
        uniquenessRatio: 1,
      },
      'test': {
        total: 1,
        totalUnique: 1,
        unique: {
          'rgb(8,8,8)': 1
        },
        uniquenessRatio: 1,
      },
    },
    formats: {
      total: 17,
      totalUnique: 2,
      unique: {
        rgb: 9,
        rgba: 8
      },
      uniquenessRatio: 2 / 17,
    },
  }
  assert.equal(actual, expected)
})

Colors('finds LCH() colors', () => {
  const actual = analyze(`
    .lch {
      /* Source: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/lch() */
      color: lch(29.2345% 44.2 27);
      color: lch(52.2345% 72.2 56.2);

      /* Capitalisation */
      color: LCH(29.2345% 44.2 27);
      color: Lch(29.2345% 44.2 27);

      /* Opacity notations */
      color: lch(52.2345% 72.2 56.2 / 1);
      color: lch(52.2345% 72.2 56.2 / .5);
      color: lch(52.2345% 72.2 56.2 / 0.5);
      color: lch(52.2345% 72.2 56.2 / 50%);
    }
  `)
  const expected = {
    total: 8,
    totalUnique: 8,
    unique: {
      'lch(29.2345% 44.2 27)': 1,
      'lch(52.2345% 72.2 56.2)': 1,

      /* Capitalisation */
      'LCH(29.2345% 44.2 27)': 1,
      'Lch(29.2345% 44.2 27)': 1,

      /* Opacity notations */
      'lch(52.2345% 72.2 56.2 / 1)': 1,
      'lch(52.2345% 72.2 56.2 / .5)': 1,
      'lch(52.2345% 72.2 56.2 / 0.5)': 1,
      'lch(52.2345% 72.2 56.2 / 50%)': 1,
    },
    uniquenessRatio: 1,
    itemsPerContext: {
      color: {
        total: 8,
        totalUnique: 8,
        unique: {
          'lch(29.2345% 44.2 27)': 1,
          'lch(52.2345% 72.2 56.2)': 1,
          'LCH(29.2345% 44.2 27)': 1,
          'Lch(29.2345% 44.2 27)': 1,
          'lch(52.2345% 72.2 56.2 / 1)': 1,
          'lch(52.2345% 72.2 56.2 / .5)': 1,
          'lch(52.2345% 72.2 56.2 / 0.5)': 1,
          'lch(52.2345% 72.2 56.2 / 50%)': 1
        },
        uniquenessRatio: 1,
      },
    },
    formats: {
      total: 8,
      totalUnique: 1,
      unique: {
        lch: 8,
      },
      uniquenessRatio: 1 / 8,
    },
  }

  assert.equal(actual.values.colors, expected)
})

Colors('finds LAB() colors', () => {
  const actual = analyze(`
    .lch {
      /* Source: https://drafts.csswg.org/css-color/#specifying-lab-lch */
      color: lab(52.2345% 40.1645 59.9971);
      color: lab(60.2345% -5.3654 58.956);
      color: lab(62.2345% -34.9638 47.7721);
      color: lab(67.5345% -8.6911 -41.6019);

      /* Capitalisation */
      color: lab(29.2345% 39.3825 20.0664);
      color: Lab(29.2345% 39.3825 20.0664);
      color: LAB(29.2345% 39.3825 20.0664);

      /* Opacity notations */
      color: lab(52.2345% 40.1645 59.9971 / 0);
      color: lab(52.2345% 40.1645 59.9971 / .5);
      color: lab(52.2345% 40.1645 59.9971 / 0.5);
      color: lab(52.2345% 40.1645 59.9971 / 50%);
    }
  `)
  const expected = {
    total: 11,
    totalUnique: 11,
    unique: {
      'lab(52.2345% 40.1645 59.9971)': 1,
      'lab(60.2345% -5.3654 58.956)': 1,
      'lab(62.2345% -34.9638 47.7721)': 1,
      'lab(67.5345% -8.6911 -41.6019)': 1,

      /* Capitalisation */
      'lab(29.2345% 39.3825 20.0664)': 1,
      'Lab(29.2345% 39.3825 20.0664)': 1,
      'LAB(29.2345% 39.3825 20.0664)': 1,

      /* Opacity notations */
      'lab(52.2345% 40.1645 59.9971 / 0)': 1,
      'lab(52.2345% 40.1645 59.9971 / .5)': 1,
      'lab(52.2345% 40.1645 59.9971 / 0.5)': 1,
      'lab(52.2345% 40.1645 59.9971 / 50%)': 1,
    },
    uniquenessRatio: 1,
    'itemsPerContext': {
      'color': {
        'total': 11,
        'totalUnique': 11,
        'unique': {
          'lab(52.2345% 40.1645 59.9971)': 1,
          'lab(60.2345% -5.3654 58.956)': 1,
          'lab(62.2345% -34.9638 47.7721)': 1,
          'lab(67.5345% -8.6911 -41.6019)': 1,
          'lab(29.2345% 39.3825 20.0664)': 1,
          'Lab(29.2345% 39.3825 20.0664)': 1,
          'LAB(29.2345% 39.3825 20.0664)': 1,
          'lab(52.2345% 40.1645 59.9971 / 0)': 1,
          'lab(52.2345% 40.1645 59.9971 / .5)': 1,
          'lab(52.2345% 40.1645 59.9971 / 0.5)': 1,
          'lab(52.2345% 40.1645 59.9971 / 50%)': 1
        },
        uniquenessRatio: 1,
      },
    },
    formats: {
      total: 11,
      totalUnique: 1,
      unique: {
        lab: 11
      },
      uniquenessRatio: 1 / 11,
    },
  }

  assert.equal(actual.values.colors, expected)
})

Colors('finds hwb() colors', () => {
  const actual = analyze(`
    .hwb {
      color: hwb(194 0% 0%);
      color: hwb(194, 0%, 0%);

      color: Hwb(194 0% 0%);
      color: HWB(194 0% 0%);

      color: hwb(194 0% 0% / .5);
      color: hwb(194 0% 0% / 0.5);
      color: hwb(194 0% 0% / 50%);
    }
  `)
  const expected = {
    total: 7,
    totalUnique: 7,
    uniquenessRatio: 1,
    unique: {
      'hwb(194 0% 0%)': 1,
      'hwb(194, 0%, 0%)': 1,

      'Hwb(194 0% 0%)': 1,
      'HWB(194 0% 0%)': 1,

      'hwb(194 0% 0% / .5)': 1,
      'hwb(194 0% 0% / 0.5)': 1,
      'hwb(194 0% 0% / 50%)': 1,
    },
    itemsPerContext: {
      color: {
        total: 7,
        totalUnique: 7,
        unique: {
          'hwb(194 0% 0%)': 1,
          'hwb(194, 0%, 0%)': 1,
          'Hwb(194 0% 0%)': 1,
          'HWB(194 0% 0%)': 1,
          'hwb(194 0% 0% / .5)': 1,
          'hwb(194 0% 0% / 0.5)': 1,
          'hwb(194 0% 0% / 50%)': 1
        },
        uniquenessRatio: 1,
      }
    },
    formats: {
      total: 7,
      totalUnique: 1,
      unique: {
        hwb: 7,
      },
      uniquenessRatio: 1 / 7,
    },
  }

  assert.equal(actual.values.colors, expected)
})

Colors('finds color() colors', () => {
  const actual = analyze(`
    .colors {
      color: color(rec2020 0.42053 0.979780 0.00579);
      color: color(display-p3 -0.6112 1.0079 -0.2192);
      color: color(profoto-rgb 0.4835 0.9167 0.2188);
      color: color(xyz-d50 0.2005 0.14089 0.4472);
    }
  `)
  const expected = {
    total: 4,
    totalUnique: 4,
    unique: {
      'color(rec2020 0.42053 0.979780 0.00579)': 1,
      'color(display-p3 -0.6112 1.0079 -0.2192)': 1,
      'color(profoto-rgb 0.4835 0.9167 0.2188)': 1,
      'color(xyz-d50 0.2005 0.14089 0.4472)': 1,
    },
    uniquenessRatio: 1,
    itemsPerContext: {
      color: {
        total: 4,
        totalUnique: 4,
        unique: {
          'color(rec2020 0.42053 0.979780 0.00579)': 1,
          'color(display-p3 -0.6112 1.0079 -0.2192)': 1,
          'color(profoto-rgb 0.4835 0.9167 0.2188)': 1,
          'color(xyz-d50 0.2005 0.14089 0.4472)': 1
        },
        uniquenessRatio: 1
      },
    },
    formats: {
      total: 4,
      totalUnique: 1,
      unique: {
        color: 4,
      },
      uniquenessRatio: 1 / 4,
    },
  }

  assert.equal(actual.values.colors, expected)
})

Colors('finds color keywords', () => {
  const actual = analyze(`
    test {
      outline: 1px solid tomato;
      border-color: Aqua;
      outline-color: whitesmoke;
      background: linear-gradient(90deg, purple 0, purple 100%);
    }
  `).values.colors
  const expected = {
    total: 5,
    totalUnique: 4,
    unique: {
      'tomato': 1,
      'Aqua': 1,
      'whitesmoke': 1,
      'purple': 2,
    },
    uniquenessRatio: 4 / 5,
    itemsPerContext: {
      outline: {
        total: 1,
        totalUnique: 1,
        unique: {
          tomato: 1,
        },
        uniquenessRatio: 1,
      },
      'border-color': {
        total: 1,
        totalUnique: 1,
        unique: {
          Aqua: 1,
        },
        uniquenessRatio: 1,
      },
      'outline-color': {
        total: 1,
        totalUnique: 1,
        unique: {
          whitesmoke: 1
        },
        uniquenessRatio: 1,
      },
      background: {
        total: 2,
        totalUnique: 1,
        unique: {
          purple: 2
        },
        uniquenessRatio: 0.5,
      },
    },
    formats: {
      total: 5,
      totalUnique: 1,
      unique: {
        named: 5,
      },
      uniquenessRatio: 1 / 5,
    },
  }
  assert.equal(actual, expected)
})

Colors('does not report false positives for color keywords', () => {
  const actual = analyze(`
    test {
      /* Not a blue keyword */
      background: url(icon-blue.png), url(blue-icon.png), url(blue_icon.png), url(icon_blue.png);

      /* Not a hex color */
      background-image: url(#footer-logo-text-linear-gradient);

      /* Not the white color keyword */
      white-space: nowrap;

      /* Not the linen color keyword */
      counter-increment: lineNo;

      /* Not the gray keyword */
      -moz-osx-font-smoothing: grayscale;

      /* Not the black color keyword */
      font-family: Arial Black, Arial Bold, Gadget, sans-serif;
      font: 1em/1 Black;
    }
  `).values.colors
  const expected = {
    total: 0,
    totalUnique: 0,
    unique: {},
    uniquenessRatio: 0,
    itemsPerContext: {},
    formats: {
      total: 0,
      totalUnique: 0,
      unique: {},
      uniquenessRatio: 0,
    },
  }

  assert.equal(actual, expected)
})

// Source: https://gist.github.com/lahmatiy/84c7fd877a78e561cac57e59e142c9e3
Colors.skip('ignores color names that are not actual colors', () => {
  const fixture = `
    test {
      animation: red; /* it's not a color but an animation name */
      unknown-property: blue; /* don't match value as a color when property is unknown */
    }
  `
  const actual = analyze(fixture).values.colors
  const expected = {
    total: 0,
    totalUnique: 0,
    unique: {},
    uniquenessRatio: 0,
    itemsPerContext: {},
    formats: {
      total: 0,
      totalUnique: 0,
      unique: {},
      uniquenessRatio: 0,
    },
  }

  assert.equal(actual, expected)
})

Colors('finds colors in var() as fallback values', () => {
  const fixture = `
    test {
      --main: #aaa;
      color: var(--main, #eee);

      /* from github */
      box-shadow: 0 3px 12px var(--color-fade-black-15), 0 0 1px rgba(27, 31, 35, .2);
      text-shadow: 0 0 var(--main, var(--sec, #000));
    }
  `
  const result = analyze(fixture)
  const actual = result.values.colors
  const expected = {
    total: 4,
    totalUnique: 4,
    unique: {
      '#aaa': 1,
      '#eee': 1,
      'rgba(27, 31, 35, .2)': 1,
      '#000': 1,
    },
    uniquenessRatio: 4 / 4,
    itemsPerContext: {
      '--main': {
        total: 1,
        totalUnique: 1,
        unique: {
          '#aaa': 1,
        },
        uniquenessRatio: 1,
      },
      'color': {
        total: 1,
        totalUnique: 1,
        unique: {
          '#eee': 1,
        },
        uniquenessRatio: 1,
      },
      'box-shadow': {
        total: 1,
        totalUnique: 1,
        unique: {
          'rgba(27, 31, 35, .2)': 1,
        },
        uniquenessRatio: 1,
      },
      'text-shadow': {
        total: 1,
        totalUnique: 1,
        unique: {
          '#000': 1,
        },
        uniquenessRatio: 1,
      },
    },
    formats: {
      total: 4,
      totalUnique: 2,
      unique: {
        hex3: 3,
        rgba: 1,
      },
      uniquenessRatio: 2 / 4,
    }
  }

  assert.equal(actual, expected)
})

Colors('ignores CSS keywords', () => {
  const fixture = `
    testColorKeywords {
      color: currentColor;
      color: currentcolor;
      color: inherit;
      color: unset;
      color: initial;
      color: transparent;
      background: none;
    }

    positive {
      background: none 0px 0px repeat scroll rgb(0, 0, 0);
    }
  `
  const actual = analyze(fixture).values.colors
  const expected = {
    total: 4,
    totalUnique: 4,
    unique: {
      'currentColor': 1,
      'currentcolor': 1,
      transparent: 1,
      'rgb(0, 0, 0)': 1,
    },
    uniquenessRatio: 4 / 4,
    itemsPerContext: {
      color: {
        total: 3,
        totalUnique: 3,
        unique: {
          'currentColor': 1,
          'currentcolor': 1,
          transparent: 1,
        },
        uniquenessRatio: 3 / 3,
      },
      background: {
        total: 1,
        totalUnique: 1,
        unique: {
          'rgb(0, 0, 0)': 1,
        },
        uniquenessRatio: 1,
      },
    },
    formats: {
      "total": 4,
      "totalUnique": 3,
      "unique": {
        currentcolor: 2,
        transparent: 1,
        rgb: 1,
      },
      "uniquenessRatio": 3 / 4,
    }
  }

  assert.equal(actual, expected)
})

// https://drafts.csswg.org/css-color/#css-system-colors
Colors('finds System Colors', () => {
  const fixture = `
    color: test-system-colors {
      color: Canvas;
      color: CanvasText;
      color: Linktext;
      color: VisitedText;
      color: ActiveText;
      color: ButtonFace;
      color: ButtonText;
      color: ButtonBorder;
      color: Field;
      color: FieldText;
      color: Highlight;
      color: HighlightText;
      color: SelectedItem;
      color: SelectedItemText;
      color: Mark;
      color: MarkText;
      color: GrayText;
    }

    test-false-positives {
      color: RandomWord;
    }
  `
  const result = analyze(fixture)
  const actual = result.values.colors
  const expected = {
    total: 17,
    totalUnique: 17,
    unique: {
      Canvas: 1,
      CanvasText: 1,
      Linktext: 1,
      VisitedText: 1,
      ActiveText: 1,
      ButtonFace: 1,
      ButtonText: 1,
      ButtonBorder: 1,
      Field: 1,
      FieldText: 1,
      Highlight: 1,
      HighlightText: 1,
      SelectedItem: 1,
      SelectedItemText: 1,
      Mark: 1,
      MarkText: 1,
      GrayText: 1,
    },
    uniquenessRatio: 17 / 17,
    itemsPerContext: {
      color: {
        total: 17,
        totalUnique: 17,
        unique: {
          Canvas: 1,
          CanvasText: 1,
          Linktext: 1,
          VisitedText: 1,
          ActiveText: 1,
          ButtonFace: 1,
          ButtonText: 1,
          ButtonBorder: 1,
          Field: 1,
          FieldText: 1,
          Highlight: 1,
          HighlightText: 1,
          SelectedItem: 1,
          SelectedItemText: 1,
          Mark: 1,
          MarkText: 1,
          GrayText: 1,
        },
        uniquenessRatio: 19 / 19,
      },
    },
    formats: {
      total: 17,
      totalUnique: 1,
      unique: {
        system: 17
      },
      uniquenessRatio: 1 / 17,
    }
  }

  assert.equal(actual, expected)
})

Colors('insane color mode', () => {
  const fixture = `
    .color-insanity {
      color: #7654CD;
      color: rgb(46.27% 32.94% 80.39%);
      color: lab(44.36% 36.05 -58.99);
      color: color(xyz-d50 0.2005 0.14089 0.4472);
    }
  `

  assert.not.throws(() => analyze(fixture))
})

Colors.run()
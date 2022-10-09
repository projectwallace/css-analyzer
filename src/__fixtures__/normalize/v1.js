export function getResult() {
	return {
		"values": {
			"colors": {
				"totalUnique": 240,
				"unique": ["#000", "#0079bf", "#0098b7"],
				"total": 1559
			},
			"fontfamilies": {
				"totalUnique": 7,
				"unique": ["\"Helvetica Neue\", \"Arial\", \"Helvetica\", sans-serif"],
				"total": 10
			},
			"fontsizes": {
				"totalUnique": 27,
				"unique": ["55px", "34px", "2em", "28px", "26px"],
				"total": 190
			},
			"prefixed": {
				"share": 0.031723436705643114,
				"totalUnique": 62,
				"unique": ["-moz-fit-content", "-ms-flexbox"],
				"total": 312
			},
			"total": 9835
		},
		"properties": {
			"prefixed": {
				"share": 0.08825622775800712,
				"totalUnique": 44,
				"unique": [
					"-moz-appearance", "-moz-box-sizing", "-moz-osx-font-smoothing"
				],
				"total": 868
			},
			"totalUnique": 157,
			"unique": [
				"-moz-appearance", "-moz-box-sizing", "-moz-osx-font-smoothing"
			],
			"total": 9835
		},
		"declarations": {
			"importants": {
				"share": 0.0037620742247076767,
				"total": 37
			},
			"totalUnique": 2613,
			"total": 9835
		},
		"selectors": {
			"identifiers": {
				"top": [{
					"identifiers": 9,
					"selector": ".phenom.mod - is - card.mod - unread.content - wrapper: not(.phenom.mod - is - not - card.mod - unread.content - wrapper: last- of - type) "
				},
				{
					"identifiers": 9,
					"selector": ".phenom.mod-is-not-card.mod-unread .content-wrapper:not(.phenom.mod-is-card.mod-unread .content-wrapper:last-of-type)"
				}, {
					"identifiers": 9, "selector": ".phenom.mod - is - not - card.mod - unread.content - wrapper: not(.phenom.mod - is - not - card.mod - unread.content - wrapper: last - of - type)"
				}],
				"average": 2.347429906542056
			},
			"specificity": {
				"top": [
					{
						"specificity": { "d": 0, "c": 0, "b": 2, "a": 0 },
						"selector": "#surface>#content"
					},
					{
						"specificity": {
							"d": 0, "c": 0, "b": 2, "a": 0
						},
						"selector": "#surface>#header"
					},
					{
						"specificity": { "d": 0, "c": 0, "b": 2, "a": 0 },
						"selector": "#clipboard-container #clipboard"
					},
					{
						"specificity": { "d": 1, "c": 2, "b": 1, "a": 0 },
						"selector": "#board::-webkit-scrollbar-button:end:increment"
					},
					{
						"specificity": { "d": 0, "c": 2, "b": 1, "a": 0 },
						"selector": ".body-single-column #content .window-main-col"
					}
				]
			},
			"universal": {
				"totalUnique": 2,
				"unique": ["*", ".intl-tel-input *"],
				"total": 2
			},
			"id": {
				"totalUnique": 38,
				"unique": ["#board", "#board.filtering .num-cards"],
				"total": 48
			},
			"js": {
				"totalUnique": 0,
				"unique": [], "total": 0
			}, "totalUnique": 3879, "total": 4280
		},
		"rules": {
			"total": 3465
		},
		"atrules": {
			"supports": {
				"totalUnique": 0,
				"unique": [],
				"total": 0
			},
			"pages": {
				"totalUnique": 0,
				"unique": [],
				"total": 0
			},
			"namespaces": {
				"totalUnique": 0,
				"unique": [],
				"total": 0
			},
			"mediaqueries": {
				"totalUnique": 29,
				"unique": ["(max-width:480px)", "(max-width:500px)"],
				"total": 75
			},
			"keyframes": {
				"totalUnique": 10,
				"unique": ["contact-fadein", "fade_back"],
				"total": 19
			},
			"imports": {
				"totalUnique": 0,
				"unique": [], "total": 0
			},
			"fontfaces": {
				"total": 1,
				totalUnique: 1,
				unique: [
					{
						count: 1,
						value: [
							{
								property: 'font-family',
								value: 'Noto Sans',
								important: false
							},
							{
								property: 'src',
								value: 'url("domain.tld")',
								important: false
							}
						]
					}
				],
			},
			"documents": {
				"totalUnique": 0,
				"unique": [], "total": 0
			},
			"charsets": {
				"totalUnique": 0,
				"unique": [], "total": 0
			},
		},
		"stylesheets": {
			"cohesion": {
				"average": 2.8383838383838382
			},
			"simplicity": 0.8095794392523364,
			"size": 359832
		}
	}
}
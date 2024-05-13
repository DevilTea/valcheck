// @ts-check
import deviltea from '@deviltea/eslint-config'

export default deviltea(
	{
		ignores: [
			// eslint ignore globs here
		],
	},
	{
		rules: {
			// overrides
			'ts/ban-types': [
				'error',
				{
					types: {
						'Function': false,
						'{}': false,
					},
				},
			],
		},
	},
)

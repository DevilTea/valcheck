import { BaseValSchema, implementValidateFn } from '../../core/schema'

export class NullSchema extends BaseValSchema({
	Name: 'null',
})<{
	Issues: {
		NULL_EXPECTED: { input: any }
	}
	Input: any
	Output: null
}> {}

implementValidateFn(
	NullSchema,
	({ input, reason, fail, pass }) => {
		if (input !== null)
			return fail([reason('NULL_EXPECTED', { input })])

		return pass(input)
	},
)

export function isNullSchema(schema: any): schema is NullSchema {
	return schema instanceof NullSchema
}

export function null_() {
	return new NullSchema()
}

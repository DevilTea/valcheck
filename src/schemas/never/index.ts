import { BaseValSchema, implementValidateFn } from '../../core/schema'

export class NeverSchema extends BaseValSchema({
	Name: 'never',
})<{
	Issues: {
		NEVER_EXPECTED: { input: any }
	}
	Input: any
	Output: never
}> {}

implementValidateFn(
	NeverSchema,
	({ input, reason, fail }) => {
		return fail([reason('NEVER_EXPECTED', input)])
	},
)

export function isNeverSchema(schema: any): schema is NeverSchema {
	return schema instanceof NeverSchema
}

export function never() {
	return new NeverSchema()
}

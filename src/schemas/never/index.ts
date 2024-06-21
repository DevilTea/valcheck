import { BaseValSchema, implementExecuteFn } from '../../core/schema'

export class NeverSchema extends BaseValSchema({
	Name: 'never',
	Issues: ['UNEXPECTED_INPUT'],
})<{
	Input: any
	Output: never
}> {}

implementExecuteFn(
	NeverSchema,
	({ input, reason, fail }) => {
		return fail([reason('UNEXPECTED_INPUT', input)])
	},
)

export function isNeverSchema(schema: any): schema is NeverSchema {
	return schema instanceof NeverSchema
}

export function never() {
	return new NeverSchema()
}

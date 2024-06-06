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
	({ input, fail }) => {
		return fail('UNEXPECTED_INPUT', input)
	},
)

export function never() {
	return new NeverSchema()
}

export function isNeverSchema(schema: any): schema is NeverSchema {
	return schema instanceof NeverSchema
}

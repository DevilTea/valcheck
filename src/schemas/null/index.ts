import { BaseValSchema, implementExecuteFn } from '../../core/schema'

export class NullSchema extends BaseValSchema({
	Name: 'null',
	Issues: ['UNEXPECTED_INPUT'],
})<{
	Material: null
	SchemaPath: []
	Input: any
	Output: null
}> {
	constructor() {
		super(null)
	}
}

implementExecuteFn(
	NullSchema,
	({ input, fail, pass }) => {
		if (input !== null)
			return fail('UNEXPECTED_INPUT', input)

		return pass(input)
	},
)

export function null_() {
	return new NullSchema()
}

export function isNullSchema(schema: any): schema is NullSchema {
	return schema instanceof NullSchema
}

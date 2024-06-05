import { BaseValSchema, implementExecuteFn } from '../../core/schema'

export class UndefinedSchema extends BaseValSchema({
	Name: 'undefined',
	Issues: ['UNEXPECTED_INPUT'],
})<{
	Material: null
	SchemaPath: []
	Input: any
	Output: undefined
}> {
	constructor() {
		super(null)
	}
}

implementExecuteFn(
	UndefinedSchema,
	({ input, fail, pass }) => {
		if (typeof input !== 'undefined')
			return fail('UNEXPECTED_INPUT', input)

		return pass(input)
	},
)

export function undefined_() {
	return new UndefinedSchema()
}

export function isUndefinedSchema(schema: any): schema is UndefinedSchema {
	return schema instanceof UndefinedSchema
}

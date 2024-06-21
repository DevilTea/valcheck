import { BaseValSchema, implementExecuteFn } from '../../core/schema'

export class UndefinedSchema extends BaseValSchema({
	Name: 'undefined',
	Issues: ['UNDEFINED_EXPECTED'],
})<{
	Input: any
	Output: undefined
}> {}

implementExecuteFn(
	UndefinedSchema,
	({ input, reason, fail, pass }) => {
		if (typeof input !== 'undefined')
			return fail([reason('UNDEFINED_EXPECTED', { input })])

		return pass(input)
	},
)

export function isUndefinedSchema(schema: any): schema is UndefinedSchema {
	return schema instanceof UndefinedSchema
}

export function undefined_() {
	return new UndefinedSchema()
}

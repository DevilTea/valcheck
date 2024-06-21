import { BaseValSchema, implementExecuteFn } from '../../core/schema'

export class FunctionSchema<Fn extends Function = Function> extends BaseValSchema({
	Name: 'function',
	Issues: ['FUNCTION_EXPECTED'],
})<{
	Input: any
	Output: Fn
}> {}

implementExecuteFn(
	FunctionSchema,
	({ input, reason, fail, pass }) => {
		if (typeof input !== 'function')
			return fail([reason('FUNCTION_EXPECTED', { input })])

		return pass(input)
	},
)

export function isFunctionSchema(schema: any): schema is FunctionSchema {
	return schema instanceof FunctionSchema
}

export function function_<Fn extends Function = Function>() {
	return new FunctionSchema<Fn>()
}

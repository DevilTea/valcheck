import { BaseValSchema, implementValidateFn } from '../../core/schema'

export class FunctionSchema<Fn extends Function = Function> extends BaseValSchema({
	Name: 'function',
})<{
	Issues: {
		FUNCTION_EXPECTED: { input: any }
	}
	Input: any
	Output: Fn
}> {}

implementValidateFn(
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

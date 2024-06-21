import { BaseValSchema, implementExecuteFn } from '../../core/schema'

export class FunctionSchema<Fn extends Function = Function> extends BaseValSchema({
	Name: 'function',
	Issues: ['UNEXPECTED_INPUT'],
})<{
	Input: any
	Output: Fn
}> {}

implementExecuteFn(
	FunctionSchema,
	({ input, reason, fail, pass }) => {
		if (typeof input === 'function')
			return pass(input)

		return fail([reason('UNEXPECTED_INPUT', input)])
	},
)

export function isFunctionSchema(schema: any): schema is FunctionSchema {
	return schema instanceof FunctionSchema
}

export function function_<Fn extends Function = Function>() {
	return new FunctionSchema<Fn>()
}

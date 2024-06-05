import { BaseValSchema, implementExecuteFn } from '../../core/schema'

export class FunctionSchema<Fn extends Function = Function> extends BaseValSchema({
	Name: 'function',
	Issues: ['UNEXPECTED_INPUT'],
})<{
	Material: null
	Input: any
	Output: Fn
}> {
	constructor() {
		super(null)
	}
}

implementExecuteFn(
	FunctionSchema,
	({ input, fail, pass }) => {
		if (typeof input !== 'function')
			return fail('UNEXPECTED_INPUT', input)

		return pass(input)
	},
)

export function function_<Fn extends Function = Function>() {
	return new FunctionSchema<Fn>()
}

export function isFunctionSchema(schema: any): schema is FunctionSchema {
	return schema instanceof FunctionSchema
}

import { BaseValSchema, implementExecuteFn } from '../../core/schema'

export class AnySchema extends BaseValSchema({
	Name: 'any',
})<{
	Material: null
	Input: any
	Output: any
}> {
	constructor() {
		super(null)
	}
}

implementExecuteFn(
	AnySchema,
	({ input, pass }) => pass(input),
)

export function any() {
	return new AnySchema()
}

export function isAnySchema(schema: any): schema is AnySchema {
	return schema instanceof AnySchema
}

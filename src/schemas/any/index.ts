import { BaseValSchema, implementExecuteFn } from '../../core/schema'

export class AnySchema extends BaseValSchema({
	Name: 'any',
})<{
	Input: any
	Output: any
}> {}

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

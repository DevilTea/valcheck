import { BaseValSchema, implementValidateFn } from '../../core/schema'

export class AnySchema extends BaseValSchema({
	Name: 'any',
})<{
	Input: any
	Output: any
}> {}

implementValidateFn(
	AnySchema,
	({ input, pass }) => pass(input),
)

export function isAnySchema(schema: any): schema is AnySchema {
	return schema instanceof AnySchema
}

export function any() {
	return new AnySchema()
}

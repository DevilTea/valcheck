import { BaseValSchema, implementExecuteFn } from '../../core/schema'

export class UnknownSchema extends BaseValSchema({
	Name: 'unknown',
})<{
	Input: any
	Output: unknown
}> {}

implementExecuteFn(
	UnknownSchema,
	({ input, pass }) => pass(input),
)

export function isUnknownSchema(schema: any): schema is UnknownSchema {
	return schema instanceof UnknownSchema
}

export function unknown() {
	return new UnknownSchema()
}

import { BaseValSchema, implementExecuteFn } from '../../core/schema'

export class UnknownSchema extends BaseValSchema({
	Name: 'unknown',
})<{
	Material: null
	Input: any
	Output: unknown
}> {
	constructor() {
		super(null)
	}
}

implementExecuteFn(
	UnknownSchema,
	({ input, pass }) => pass(input),
)

export function unknown() {
	return new UnknownSchema()
}

export function isUnknownSchema(schema: any): schema is UnknownSchema {
	return schema instanceof UnknownSchema
}

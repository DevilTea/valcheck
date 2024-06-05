import { type AnyValSchema, BaseValSchema, type OutputOf, type SchemaPathOf, type ValSchemaPath, implementExecuteFn } from '../../core/schema'
import { type Primitive, type PrimitiveValueToSchema, isPrimitive, toPrimitiveSchema } from '../../core/utils'
import { type AnySchema, any } from '../any'

const ITEM_PATH = '<item>'

type ArraySchemaMaterial = AnyValSchema

type ArraySchemaOutput<Material extends ArraySchemaMaterial> = OutputOf<Material>[] & NonNullable<unknown>

type ArraySchemaPath<Material extends ArraySchemaMaterial, P extends ValSchemaPath = SchemaPathOf<Material>> =
	// If "P" is an union type, then we need to iterate over each item in the union type.
	P extends any
		? [typeof ITEM_PATH, ...P]
		: never

export class ArraySchema<Material extends ArraySchemaMaterial> extends BaseValSchema({
	Name: 'array',
	Issues: ['UNEXPECTED_INPUT', 'UNEXPECTED_ARRAY_ITEM'],
})<{
	Material: Material
	SchemaPath: ArraySchemaPath<Material>
	Input: any
	Output: ArraySchemaOutput<Material>
}> {
	constructor(material: Material) {
		super(material)
	}
}

implementExecuteFn(
	ArraySchema,
	({ schema, input, context, fail, pass }) => {
		if (!Array.isArray(input))
			return fail('UNEXPECTED_INPUT', input)

		let failed = false
		const path = [...context.currentPath]
		for (let i = 0; i < input.length; i++) {
			context.currentPath = [...path, i]
			const item = input[i]!
			const itemResult = schema._material.execute(item, context)
			if (itemResult.type === 'failed')
				failed = true
		}

		context.currentPath = path

		if (failed)
			return fail()

		return pass(input)
	},
)

export function array<Material extends Primitive>(item?: Material): ArraySchema<PrimitiveValueToSchema<Material>>
export function array<Material extends AnyValSchema = AnySchema>(item?: Material): ArraySchema<Material>
export function array(item: Primitive | AnyValSchema = any()) {
	return new ArraySchema(
		isPrimitive(item)
			? toPrimitiveSchema(item)
			: item,
	)
}

export function isArraySchema(schema: any): schema is ArraySchema<any> {
	return schema instanceof ArraySchema
}

import { type AnyValSchema, BaseValSchemaWithMaterial, type OutputOf, implementExecuteFn } from '../../core/schema'
import { type Primitive, type PrimitiveValueToSchema, isPrimitive, toPrimitiveSchema } from '../../core/utils'
import { type AnySchema, any } from '../any'

type ArraySchemaMaterial = AnyValSchema

type ArraySchemaOutput<Material extends ArraySchemaMaterial> = OutputOf<Material>[] & NonNullable<unknown>

export class ArraySchema<Material extends ArraySchemaMaterial> extends BaseValSchemaWithMaterial({
	Name: 'array',
	Issues: ['UNEXPECTED_INPUT', 'UNEXPECTED_ARRAY_ITEM'],
})<{
	Material: Material
	Input: any
	Output: ArraySchemaOutput<Material>
}> {}

implementExecuteFn(
	ArraySchema,
	({ schema, input, context, reason, fail, pass }) => {
		if (!Array.isArray(input))
			return fail([reason('UNEXPECTED_INPUT', input)])

		const reasons: any[] = []
		const path = [...context.currentPath]
		for (let i = 0; i < input.length; i++) {
			context.currentPath = [...path, i]
			const item = input[i]!
			const itemResult = schema._material.execute(item, context)
			if (itemResult.type === 'failed')
				reasons.push(reason('UNEXPECTED_ARRAY_ITEM', item, itemResult.reasons))
		}
		context.currentPath = path

		if (reasons.length > 0)
			return fail(reasons)

		return pass(input)
	},
)

export function isArraySchema(schema: any): schema is ArraySchema<any> {
	return schema instanceof ArraySchema
}

export type RawArraySchemaMaterial = Primitive | AnyValSchema
export type CreateArraySchema<RawMaterial extends RawArraySchemaMaterial> = ArraySchema<
	RawMaterial extends Primitive
		? PrimitiveValueToSchema<RawMaterial>
		: RawMaterial
>

export function array<RawMaterial extends RawArraySchemaMaterial = AnySchema>(item?: RawMaterial): CreateArraySchema<RawMaterial>
export function array(item: Primitive | AnyValSchema = any()) {
	return new ArraySchema(
		isPrimitive(item)
			? toPrimitiveSchema(item)
			: item,
	)
}

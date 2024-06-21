import { type AnyValSchema, BaseValSchemaWithMaterial, type OutputOf, implementExecuteFn } from '../../core/schema'
import { type As, type OptionalItem, type Primitive, type PrimitiveValueToSchema, isOptionalItem, isPrimitive, toPrimitiveSchema } from '../../core/utils'

type ObjectSchemaMaterial = Record<string | symbol, AnyValSchema | OptionalItem<AnyValSchema>>

type ObjectSchemaOutput<Material extends ObjectSchemaMaterial> = {
	[K in keyof Material]: Material[K] extends OptionalItem<AnyValSchema>
		? OutputOf<Material[K][1]> | undefined
		: OutputOf<Material[K]>
} & {}

export class ObjectSchema<Material extends ObjectSchemaMaterial = ObjectSchemaMaterial> extends BaseValSchemaWithMaterial({
	Name: 'object',
	Issues: ['UNEXPECTED_INPUT', 'MISSING_OBJECT_KEY', 'UNEXPECTED_OBJECT_VALUE'],
})<{
	Material: Material
	Input: any
	Output: ObjectSchemaOutput<Material>
}> {}

implementExecuteFn(
	ObjectSchema,
	({ schema, input, context, reason, fail, pass }) => {
		if (typeof input !== 'object' || input === null || Array.isArray(input))
			return fail([reason('UNEXPECTED_INPUT', input)])

		const reasons: any[] = []
		const material = schema._material
		const path = [...context.currentPath]
		const keys = Reflect.ownKeys(material)
		for (const key of keys) {
			context.currentPath = [...path, key]

			const item = material[key]!

			if (
				(key in input) === false
				&& isOptionalItem(item) === false
			) {
				reasons.push(reason('MISSING_OBJECT_KEY', key))
				continue
			}

			const value = input[key]!

			if (isOptionalItem(item) && value === undefined)
				continue

			const valueResult = isOptionalItem(item)
				? item[1].execute(value, context)
				: item.execute(value, context)

			if (valueResult.type === 'failed')
				reasons.push(reason('UNEXPECTED_OBJECT_VALUE', value, valueResult.reasons))
		}
		context.currentPath = path

		if (reasons.length > 0)
			return fail(reasons)

		return pass(input)
	},
)

export function isObjectSchema(schema: any): schema is ObjectSchema {
	return schema instanceof ObjectSchema
}

export type RawObjectSchemaMaterial<V extends Primitive = Primitive> = Record<string | symbol, V | AnyValSchema | OptionalItem<V | AnyValSchema>>
export type CreateObjectSchema<
	RawMaterial extends RawObjectSchemaMaterial<V>,
	Material extends ObjectSchemaMaterial = As<
		ObjectSchemaMaterial,
		{
			[K in keyof RawMaterial as RawMaterial[K] extends OptionalItem<any> ? never : K]: RawMaterial[K] extends Primitive
				? PrimitiveValueToSchema<RawMaterial[K]>
				: RawMaterial[K]
		} & {
			[K in keyof RawMaterial as RawMaterial[K] extends OptionalItem<any> ? K : never]: RawMaterial[K] extends OptionalItem<any>
				? RawMaterial[K][1] extends Primitive
					? PrimitiveValueToSchema<RawMaterial[K][1]>
					: RawMaterial[K][1]
				: never
		}
	>,
	V extends Primitive = Primitive,
> = ObjectSchema<Material>

export function object<RawMaterial extends RawObjectSchemaMaterial<V>, V extends Primitive = Primitive>(material: RawMaterial): CreateObjectSchema<RawMaterial>
export function object(material: RawObjectSchemaMaterial) {
	const resolvedMaterial: ObjectSchemaMaterial = {}
	for (const key of Reflect.ownKeys(material)) {
		const item = material[key]!

		if (isOptionalItem(item)) {
			resolvedMaterial[key] = [
				item[0],
				isPrimitive(item[1])
					? toPrimitiveSchema(item[1])
					: item[1],
			]
			continue
		}

		resolvedMaterial[key] = isPrimitive(item)
			? toPrimitiveSchema(item)
			: item
	}
	return new ObjectSchema(resolvedMaterial)
}

import { type AnyValSchema, BaseValSchemaWithMaterial, type OutputOf, type SchemaPathOf, implementExecuteFn } from '../../core/schema'
import { type As, type Primitive, type PrimitiveValueToSchema, isPrimitive, toPrimitiveSchema } from '../../core/utils'

type ObjectSchemaMaterial = Record<string | symbol, AnyValSchema>

type ObjectSchemaOutput<Material extends ObjectSchemaMaterial> = {
	[K in keyof Material]: OutputOf<Material[K]>
} & {}

type ObjectSchemaPath<Material extends ObjectSchemaMaterial> = (keyof Material) extends infer K extends (keyof Material)
	? K extends number | string | symbol
		? [K extends (number | string) ? (K | `${K}`) : K, ...SchemaPathOf<Material[K]>]
		: never
	: never

export class ObjectSchema<Material extends ObjectSchemaMaterial = ObjectSchemaMaterial> extends BaseValSchemaWithMaterial({
	Name: 'object',
	Issues: ['UNEXPECTED_INPUT', 'MISSING_OBJECT_KEY', 'UNEXPECTED_OBJECT_VALUE'],
})<{
	Material: Material
	SchemaPath: ObjectSchemaPath<Material>
	Input: any
	Output: ObjectSchemaOutput<Material>
}> {}

implementExecuteFn(
	ObjectSchema,
	({ schema, input, context, fail, pass }) => {
		if (typeof input !== 'object' || input === null || Array.isArray(input))
			return fail('UNEXPECTED_INPUT', input)

		let failed = false
		const material = schema._material
		const path = [...context.currentPath]
		const keys = Reflect.ownKeys(material)
		for (const key of keys) {
			context.currentPath = [...path, key]

			if ((key in input) === false) {
				fail('MISSING_OBJECT_KEY', key)
				failed = true
				continue
			}

			const value = input[key]!
			const valueResult = material[key]!.execute(value, context)
			if (valueResult.type === 'failed')
				failed = true
		}

		context.currentPath = path

		if (failed)
			return fail()

		return pass(input)
	},
)

export function isObjectSchema(schema: any): schema is ObjectSchema {
	return schema instanceof ObjectSchema
}

export type RawObjectSchemaMaterial<V extends Primitive = Primitive> = Record<string | symbol, V | AnyValSchema>
export type CreateObjectSchema<
	RawMaterial extends RawObjectSchemaMaterial<V>,
	Material extends ObjectSchemaMaterial = As<
		ObjectSchemaMaterial,
		{
			[K in keyof RawMaterial]: RawMaterial[K] extends Primitive
				? PrimitiveValueToSchema<RawMaterial[K]>
				: RawMaterial[K]
		}
	>,
	V extends Primitive = Primitive,
> = ObjectSchema<Material>

export function object<RawMaterial extends RawObjectSchemaMaterial<V>, V extends Primitive = Primitive>(material: RawMaterial): CreateObjectSchema<RawMaterial>
export function object(material: RawObjectSchemaMaterial) {
	const resolvedMaterial: ObjectSchemaMaterial = {}
	for (const key of Reflect.ownKeys(material)) {
		const value = material[key]!
		resolvedMaterial[key] = isPrimitive(value)
			? toPrimitiveSchema(value)
			: value
	}
	return new ObjectSchema(resolvedMaterial)
}

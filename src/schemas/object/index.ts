import { type AnyValSchema, BaseValSchemaWithMaterial, type OutputOf, type SchemaPathOf, implementExecuteFn } from '../../core/schema'
import { type Primitive, type PrimitiveValueToSchema, isPrimitive, toPrimitiveSchema } from '../../core/utils'

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

type RawObjectSchemaMaterial = Record<string | symbol, Primitive | AnyValSchema>
type ResolveObjectSchemaMaterial<
	RawMaterial extends RawObjectSchemaMaterial,
	Material = {
		[K in keyof RawMaterial]: RawMaterial[K] extends Primitive
			? PrimitiveValueToSchema<RawMaterial[K]>
			: RawMaterial[K]
	},
> = Material extends ObjectSchemaMaterial
	? Material
	: never
function resolveMaterial<RawMaterial extends RawObjectSchemaMaterial>(rawMaterial: RawMaterial): ResolveObjectSchemaMaterial<RawMaterial> {
	const resolved: any = {}
	for (const key of Reflect.ownKeys(rawMaterial)) {
		const value = rawMaterial[key]!
		resolved[key] = isPrimitive(value)
			? toPrimitiveSchema(value)
			: value
	}
	return resolved
}

export function object<RawMaterial extends RawObjectSchemaMaterial>(material: RawMaterial) {
	const resolvedMaterial = resolveMaterial(material) as ResolveObjectSchemaMaterial<RawMaterial>
	return new ObjectSchema(resolvedMaterial)
}

export function isObjectSchema(schema: any): schema is ObjectSchema {
	return schema instanceof ObjectSchema
}

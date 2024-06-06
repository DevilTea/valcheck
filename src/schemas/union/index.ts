import { type AnyValSchema, BaseValSchemaWithMaterial, type OutputOf, type SchemaPathOf, implementExecuteFn } from '../../core/schema'
import type { IndexOf, Primitive } from '../../core/utils'
import { type NeverSchema, never } from '../never'
import { type OptimizeMaterial, optimizeMaterial } from './optimizeMaterial'

export type RawUnionSchemaMaterial = (Primitive | AnyValSchema)[]
export type UnionSchemaMaterial = AnyValSchema[]

type UnionSchemaOutput<Material extends UnionSchemaMaterial> = Material[number] extends infer S
	? S extends AnyValSchema
		? OutputOf<S>
		: never
	: never

type UnionSchemaPath<Material extends UnionSchemaMaterial> = IndexOf<Material> extends infer Index
	? Index extends number
		? [`<${Index}>`, ...SchemaPathOf<Material[Index]>]
		: never
	: never

export class UnionSchema<Material extends UnionSchemaMaterial = UnionSchemaMaterial> extends BaseValSchemaWithMaterial({
	Name: 'union',
	Issues: ['UNEXPECTED_INPUT'],
})<{
	Material: Material
	SchemaPath: UnionSchemaPath<Material>
	Input: any
	Output: UnionSchemaOutput<Material>
}> {}

implementExecuteFn(
	UnionSchema,
	({ schema, input, context, fail, pass }) => {
		context.shouldCollectReason = false
		let failed = true

		for (const _schema of schema._material) {
			const result = _schema.execute(input)

			if (result.type === 'passed') {
				failed = false
				break
			}
		}

		context.shouldCollectReason = true

		if (failed)
			return fail('UNEXPECTED_INPUT', input)

		return pass(input)
	},
)

export function isUnionSchema(schema: any): schema is UnionSchema {
	return schema instanceof UnionSchema
}

export type CreateUnionSchema<
	RawMaterial extends RawUnionSchemaMaterial,
	OptimizedMaterial extends UnionSchemaMaterial = OptimizeMaterial<RawMaterial>,
> = OptimizedMaterial extends { length: 0 }
	? NeverSchema
	: OptimizedMaterial extends { length: 1 }
		? OptimizedMaterial[0]
		: UnionSchema<OptimizedMaterial>

export function union<RawMaterial extends RawUnionSchemaMaterial>(...material: [...RawMaterial]): CreateUnionSchema<RawMaterial>
export function union(...material: RawUnionSchemaMaterial): AnyValSchema {
	const optimized = optimizeMaterial(material)
	if (optimized.length === 0)
		return never()

	if (optimized.length === 1)
		return optimized[0]!

	return new UnionSchema(optimized)
}

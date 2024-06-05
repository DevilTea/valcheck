import { type AnyValSchema, BaseValSchema, type OutputOf, type SchemaPathOf, implementExecuteFn } from '../../core/schema'
import type { IndexOf, Primitive } from '../../core/utils'
import { type NeverSchema, never } from '../never'
import { type OptimizeMaterial, optimizeMaterial } from './optimizeMaterial'

export type RawIntersectionSchemaMaterial = (Primitive | AnyValSchema)[]
type IntersectionSchemaMaterial = AnyValSchema[]

type _IntersectionSchemaOutput_ToTupleUnion<Material extends IntersectionSchemaMaterial> = Material[number] extends infer S
	? S extends AnyValSchema
		? [OutputOf<S>]
		: never
	: never

type _IntersectionSchemaOutput_ToIntersection<T extends [any]> = (T extends [any] ? (_: T) => any : never) extends ((i: [infer I]) => any)
	? I
	: never

type IntersectionSchemaOutput<Material extends IntersectionSchemaMaterial> = _IntersectionSchemaOutput_ToIntersection<_IntersectionSchemaOutput_ToTupleUnion<Material>>

type IntersectionSchemaPath<Material extends IntersectionSchemaMaterial> = IndexOf<Material> extends infer Index
	? Index extends number
		? [Index, ...SchemaPathOf<Material[Index]>]
		: never
	: never

export class IntersectionSchema<Material extends IntersectionSchemaMaterial = IntersectionSchemaMaterial> extends BaseValSchema({
	Name: 'intersection',
	Issues: ['UNEXPECTED_INPUT'],
})<{
	Material: Material
	SchemaPath: IntersectionSchemaPath<Material>
	Input: any
	Output: IntersectionSchemaOutput<Material>
}> {
	constructor(material: Material) {
		super(material)
	}
}

implementExecuteFn(
	IntersectionSchema,
	({ schema, input, context, fail, pass }) => {
		context.shouldCollectReason = false

		let failed = false
		for (const _schema of schema._material) {
			const result = _schema.execute(input)
			if (result.type === 'failed') {
				failed = true
				break
			}
		}

		context.shouldCollectReason = true

		if (failed)
			return fail('UNEXPECTED_INPUT', input)

		return pass(input)
	},
)
export type CreateIntersectionSchema<
	RawMaterial extends RawIntersectionSchemaMaterial,
	OptimizedMaterial extends IntersectionSchemaMaterial = OptimizeMaterial<RawMaterial>,
> = OptimizedMaterial extends { length: 0 }
	? NeverSchema
	: OptimizedMaterial extends { length: 1 }
		? OptimizedMaterial[0]
		: IntersectionSchema<OptimizedMaterial>

export function intersection<RawMaterial extends RawIntersectionSchemaMaterial>(material: [...RawMaterial]): CreateIntersectionSchema<RawMaterial>
export function intersection(material: RawIntersectionSchemaMaterial): any {
	const optimized = optimizeMaterial(material)

	if (optimized.length === 0)
		return never()

	if (optimized.length === 1)
		return optimized[0]!

	return new IntersectionSchema(optimized)
}

export function isIntersectionSchema(schema: any): schema is IntersectionSchema {
	return schema instanceof IntersectionSchema
}

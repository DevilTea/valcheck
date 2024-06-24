import { type AnyValSchema, BaseValSchemaWithMaterial, type OutputOf, implementExecuteFn } from '../../core/schema'
import { type NeverSchema, never } from '../never'
import { type OptimizeMaterial, type RawIntersectionSchemaMaterial, optimizeMaterial } from './optimizeMaterial'

type IntersectionSchemaMaterial = AnyValSchema[]

type ToTupleUnion<Material extends IntersectionSchemaMaterial> = Material[number] extends infer S
	? S extends AnyValSchema
		? [OutputOf<S>]
		: never
	: never

type ToIntersection<T extends [any]> = (T extends [any] ? (_: T) => any : never) extends ((i: [infer I]) => any)
	? I
	: never

type IntersectionSchemaOutput<Material extends IntersectionSchemaMaterial> = ToIntersection<ToTupleUnion<Material>>

export class IntersectionSchema<Material extends IntersectionSchemaMaterial = IntersectionSchemaMaterial> extends BaseValSchemaWithMaterial({
	Name: 'intersection',
})<{
	Issues: {
		BRANCH_FAILED: { input: any }
	}
	Material: Material
	Input: any
	Output: IntersectionSchemaOutput<Material>
}> {}

implementExecuteFn(
	IntersectionSchema,
	({ schema, input, reason, fail, pass }) => {
		let failed = false
		const reasons: any[] = []

		for (const _schema of schema._material) {
			const result = _schema.execute(input)
			if (result.type === 'failed') {
				failed = true
				reasons.push(...result.reasons)
				break
			}
		}

		if (failed)
			return fail([reason('BRANCH_FAILED', { input }, reasons)])

		return pass(input)
	},
)

export function isIntersectionSchema(schema: any): schema is IntersectionSchema {
	return schema instanceof IntersectionSchema
}

export type CreateIntersectionSchema<
	RawMaterial extends RawIntersectionSchemaMaterial,
	OptimizedMaterial extends IntersectionSchemaMaterial = OptimizeMaterial<RawMaterial>,
> = OptimizedMaterial extends { length: 0 }
	? NeverSchema
	: OptimizedMaterial extends { length: 1 }
		? OptimizedMaterial[0]
		: IntersectionSchema<OptimizedMaterial>

export function intersection<RawMaterial extends RawIntersectionSchemaMaterial>(...material: [...RawMaterial]): CreateIntersectionSchema<RawMaterial>
export function intersection(...material: RawIntersectionSchemaMaterial) {
	const optimized = optimizeMaterial(material)

	if (optimized.length === 0)
		return never()

	if (optimized.length === 1)
		return optimized[0]!

	return new IntersectionSchema(optimized)
}

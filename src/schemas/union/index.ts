import { type AnyValSchema, BaseValSchemaWithMaterial, type OutputOf, implementExecuteFn } from '../../core/schema'
import type { Primitive } from '../../core/utils'
import { type NeverSchema, never } from '../never'
import { type OptimizeMaterial, optimizeMaterial } from './optimizeMaterial'

export type RawUnionSchemaMaterial = (Primitive | AnyValSchema)[]
export type UnionSchemaMaterial = AnyValSchema[]

type UnionSchemaOutput<Material extends UnionSchemaMaterial> = Material[number] extends infer S
	? S extends AnyValSchema
		? OutputOf<S>
		: never
	: never

export class UnionSchema<Material extends UnionSchemaMaterial = UnionSchemaMaterial> extends BaseValSchemaWithMaterial({
	Name: 'union',
	Issues: ['BRANCH_FAILED'],
})<{
	Material: Material
	Input: any
	Output: UnionSchemaOutput<Material>
}> {}

implementExecuteFn(
	UnionSchema,
	({ schema, input, reason, fail, pass }) => {
		let failed = true
		const reasons: any[] = []

		for (const _schema of schema._material) {
			const result = _schema.execute(input)

			if (result.type === 'passed') {
				failed = false
				break
			}

			reasons.push(...result.reasons)
		}

		if (failed)
			return fail([reason('BRANCH_FAILED', { input }, reasons)])

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

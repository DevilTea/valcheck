import { type AnyValSchema, BaseValSchemaWithMaterial, type MaterialOf, type OutputOf, type SchemaPathOf, implementExecuteFn } from '../../core/schema'
import { type Primitive, type PrimitiveValueToSchema, isPrimitive, toPrimitiveSchema } from '../../core/utils'
import { type NumberSchema, isNumberSchema } from '../number'
import { type StringSchema, isStringSchema, string } from '../string'
import type { CreateTemplateLiteralSchema } from '../string/templateLiteral'
import { type SymbolSchema, isSymbolSchema, symbol } from '../symbol'
import { type CreateUnionSchema, type UnionSchema, isUnionSchema, union } from '../union'

const KEY_PATH = '<key>'
const VALUE_PATH = '<value>'

type RawRecordSchemaMaterialOfKey = string | number | symbol | StringSchema | NumberSchema | SymbolSchema | UnionSchema<(StringSchema | NumberSchema | SymbolSchema)[]>
type RawRecordSchemaMaterial = [key: RawRecordSchemaMaterialOfKey, value: Primitive | AnyValSchema]

type RecordSchemaMaterialOfKey = StringSchema | SymbolSchema | UnionSchema<(StringSchema | SymbolSchema)[]>
export type RecordSchemaMaterial = [key: RecordSchemaMaterialOfKey, value: AnyValSchema]
export type RecordSchemaOutput<Material extends RecordSchemaMaterial> = Record<OutputOf<Material[0]>, OutputOf<Material[1]>>
export type RecordSchemaPath<Material extends RecordSchemaMaterial> = [] | [typeof KEY_PATH, ...SchemaPathOf<Material[0]>] | [typeof VALUE_PATH, ...SchemaPathOf<Material[1]>]

function _collectRequiredKeys(keySchema: RecordSchemaMaterialOfKey): (string | symbol)[] {
	if (isStringSchema(keySchema) && keySchema.isSpecific())
		return [keySchema._material]

	if (isSymbolSchema(keySchema) && keySchema.isSpecific())
		return [keySchema._material]

	if (isUnionSchema(keySchema))
		return [...new Set(keySchema._material.flatMap(schema => _collectRequiredKeys(schema)))]

	return []
}
function collectRequiredKeys(keySchema: RecordSchemaMaterialOfKey) {
	return new Set(_collectRequiredKeys(keySchema))
}

export class RecordSchema<Material extends RecordSchemaMaterial> extends BaseValSchemaWithMaterial({
	Name: 'record',
	Issues: ['UNEXPECTED_INPUT'],
})<{
	Material: Material
	SchemaPath: RecordSchemaPath<Material>
	Input: any
	Output: RecordSchemaOutput<Material>
}> {
	_requiredKeys: Set<string | symbol>

	constructor(material: Material) {
		super(material)
		this._requiredKeys = collectRequiredKeys(material[0])
	}
}

implementExecuteFn(
	RecordSchema,
	({ schema, input, context, fail, pass }) => {
		if (typeof input !== 'object' || input === null || Array.isArray(input))
			return fail('UNEXPECTED_INPUT', input)

		const material = schema._material
		const missingKeys = new Set(schema._requiredKeys)
		const keySchema = material[0]
		const valueSchema = material[1]

		let failed = false
		const path = [...context.currentPath]

		for (const key of Reflect.ownKeys(input)) {
			context.currentPath = [...path, key]

			missingKeys.delete(key)
			const keyResult = keySchema.execute(key, context)
			if (keyResult.type === 'failed') {
				failed = true
				continue
			}

			const value = input[key]!
			const valueResult = valueSchema.execute(value, context)
			if (valueResult.type === 'failed')
				failed = true
		}

		if (missingKeys.size > 0)
			failed = true

		context.currentPath = path

		if (failed)
			return fail()

		return pass(input)
	},
)

type ResolveRawUnionSchemMaterial<Material extends (StringSchema | NumberSchema | SymbolSchema)[]> = Material extends [infer Item extends (StringSchema | NumberSchema | SymbolSchema), ...infer Rest extends (StringSchema | NumberSchema | SymbolSchema)[]]
	? [
			Item extends NumberSchema
				? CreateTemplateLiteralSchema<[Item]>
				: Item,
			...ResolveRawUnionSchemMaterial<Rest>,
		]
	: []
type ResolveRawRecordSchemaMaterial<RawMaterial extends RawRecordSchemaMaterial> = [
	key:
		/* eslint-disable style/indent */
		| RawMaterial[0] extends string ? CreateTemplateLiteralSchema<[RawMaterial[0]]>
		: RawMaterial[0] extends number ? CreateTemplateLiteralSchema<[RawMaterial[0]]>
		: RawMaterial[0] extends NumberSchema ? CreateTemplateLiteralSchema<[RawMaterial[0]]>
		: RawMaterial[0] extends symbol ? SymbolSchema<RawMaterial[0]>
		: RawMaterial[0] extends UnionSchema<(StringSchema | NumberSchema | SymbolSchema)[]> ? CreateUnionSchema<ResolveRawUnionSchemMaterial<MaterialOf<RawMaterial[0]>>>
		: RawMaterial[0],
		/* eslint-enable style/indent */
	value: RawMaterial[1] extends Primitive ? PrimitiveValueToSchema<RawMaterial[1]> : RawMaterial[1],
] extends infer Material extends RecordSchemaMaterial
	? Material
	: never
function resolveRawRecordSchemaMaterial(rawMaterial: RawRecordSchemaMaterial): RecordSchemaMaterial {
	const rawValue = rawMaterial[1]!
	const value = isPrimitive(rawValue) ? toPrimitiveSchema(rawValue) : rawValue
	const rawKey = rawMaterial[0]!

	if (
		typeof rawKey === 'string'
		|| typeof rawKey === 'number'
		|| isNumberSchema(rawKey)
	)
		return [string(rawKey), value]

	if (typeof rawKey === 'symbol')
		return [symbol(rawKey), value]

	if (isUnionSchema(rawKey)) {
		return [
			union(rawKey._material.map(schema => isNumberSchema(schema) ? string(schema) : schema)) as any,
			value,
		]
	}

	return [rawKey, value]
}

export function record<
	RawMaterial extends RawRecordSchemaMaterial,
	Material extends RecordSchemaMaterial = ResolveRawRecordSchemaMaterial<RawMaterial>,
>(rawMaterial: RawMaterial): RecordSchema<Material> {
	const material = resolveRawRecordSchemaMaterial(rawMaterial)
	return new RecordSchema(material) as any
}

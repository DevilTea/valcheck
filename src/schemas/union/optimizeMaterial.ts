import type { AnyValSchema, MaterialOf, OutputOf } from '../../core/schema'
import { type ConvertPrimitives, type IsEmptyList, type IsInclude, type PickByIndex, convertPrimitives } from '../../core/utils'
import type { AnySchema } from '../any'
import { isAnySchema } from '../any'
import { type BigintSchema, isBigintSchema } from '../bigint'
import { type BooleanSchema, isBooleanSchema } from '../boolean'
import { type NeverSchema, isNeverSchema } from '../never'
import { type NumberSchema, isNumberSchema } from '../number'
import { type StringSchema, isStringSchema } from '../string'
import type { TemplateLiteralMaterial } from '../string/templateLiteral'
import { type UnknownSchema, isUnknownSchema } from '../unknown'
import { type SymbolSchema, isSymbolSchema } from '../symbol'
import { type NullSchema, isNullSchema } from '../null'
import { type UndefinedSchema, isUndefinedSchema } from '../undefined'
import { type RawUnionSchemaMaterial, type UnionSchema, isUnionSchema } from '.'

type FlattenUnionSchemas<Material extends RawUnionSchemaMaterial, Result extends RawUnionSchemaMaterial = []> = Material extends [infer Item extends RawUnionSchemaMaterial[number], ...infer Rest extends RawUnionSchemaMaterial]
	? Item extends UnionSchema<any>
		? FlattenUnionSchemas<Rest, [...Result, ...MaterialOf<Item>]>
		: FlattenUnionSchemas<Rest, [...Result, Item]>
	: Result
function flattenMaterial(material: RawUnionSchemaMaterial) {
	const result: RawUnionSchemaMaterial = []

	for (const schema of material) {
		if (isUnionSchema(schema))
			result.push(...schema._material)
		else
			result.push(schema)
	}

	return result
}

interface MaterialIndexInfoShape<T> {
	null: T
	undefined: T

	string: T
	specificString: T
	number: T
	specificNumber: T
	bigint: T
	specificBigint: T
	boolean: T
	specificBoolean: T
	symbol: T
	specificSymbol: T

	templateLiteral: T
}
interface MaterialIndexInfo extends MaterialIndexInfoShape<{ picked: number[], value: any[] }> {}
type UpdateInfoIf<
	Condition extends boolean,
	OldInfo extends MaterialIndexInfo,
	TargetKey extends keyof MaterialIndexInfo,
	Data extends { picked: number[], value: any[] },
> = Condition extends true
	? {
			[K in keyof MaterialIndexInfo]: K extends TargetKey ? Data : OldInfo[K]
		}
	: OldInfo
type Optimize<
	Material extends AnyValSchema[],
	Info extends MaterialIndexInfo = MaterialIndexInfoShape<{ picked: [], value: [] }>,
	OriginalMaterial extends AnyValSchema[] = Material,
	Progress extends 0[] = [],
	CurrentIndex extends number = Progress['length'],
> = Material extends [infer Item extends AnyValSchema, ...infer Rest extends AnyValSchema[]]
	/* eslint-disable style/indent */
	/* If */
	? Item extends (AnySchema | UnknownSchema) ? [Item]
	/* Else */
	: Optimize<
		Rest,
		| Item extends NeverSchema ? Info
		: Item extends NullSchema ? UpdateInfoIf<IsEmptyList<Info['null']['picked']>, Info, 'null', { picked: [CurrentIndex], value: [null] }>
		: Item extends UndefinedSchema ? UpdateInfoIf<IsEmptyList<Info['undefined']['picked']>, Info, 'undefined', { picked: [CurrentIndex], value: [undefined] }>
		: Item extends StringSchema<null> ? UpdateInfoIf<IsEmptyList<Info['string']['picked']>, Info, 'string', { picked: [CurrentIndex], value: [string] }>
		: Item extends NumberSchema<null> ? UpdateInfoIf<IsEmptyList<Info['number']['picked']>, Info, 'number', { picked: [CurrentIndex], value: [number] }>
		: Item extends BigintSchema<null> ? UpdateInfoIf<IsEmptyList<Info['bigint']['picked']>, Info, 'bigint', { picked: [CurrentIndex], value: [bigint] }>
		: Item extends BooleanSchema<null> ? UpdateInfoIf<IsEmptyList<Info['boolean']['picked']>, Info, 'boolean', { picked: [CurrentIndex], value: [boolean] }>
		: Item extends SymbolSchema<null> ? UpdateInfoIf<IsEmptyList<Info['symbol']['picked']>, Info, 'symbol', { picked: [CurrentIndex], value: [symbol] }>
		: Item extends StringSchema<string> ? UpdateInfoIf<
			[
				IsEmptyList<Info['string']['picked']>,
				IsInclude<Info['specificString']['value'], OutputOf<Item>> extends true ? false : true,
			] extends [true, true] ? true : false,
			Info,
			'specificString',
			{ picked: [...Info['specificString']['picked'], CurrentIndex], value: [...Info['specificString']['value'], OutputOf<Item>] }
		>
		: Item extends NumberSchema<number> ? UpdateInfoIf<
			[
				IsEmptyList<Info['number']['picked']>,
				IsInclude<Info['specificNumber']['value'], OutputOf<Item>> extends true ? false : true,
			] extends [true, true] ? true : false,
			Info,
			'specificNumber',
			{ picked: [...Info['specificNumber']['picked'], CurrentIndex], value: [...Info['specificNumber']['value'], OutputOf<Item>] }
		>
		: Item extends BigintSchema<bigint> ? UpdateInfoIf<
			[
				IsEmptyList<Info['bigint']['picked']>,
				IsInclude<Info['specificBigint']['value'], OutputOf<Item>> extends true ? false : true,
			] extends [true, true] ? true : false,
			Info,
			'specificBigint',
			{ picked: [...Info['specificBigint']['picked'], CurrentIndex], value: [...Info['specificBigint']['value'], OutputOf<Item>] }
		>
		: Item extends BooleanSchema<boolean> ? UpdateInfoIf<
			[
				IsEmptyList<Info['boolean']['picked']>,
				IsInclude<Info['specificBoolean']['value'], OutputOf<Item>> extends true ? false : true,
			] extends [true, true] ? true : false,
			Info,
			'specificBoolean',
			{ picked: [...Info['specificBoolean']['picked'], CurrentIndex], value: [...Info['specificBoolean']['value'], OutputOf<Item>] }
		>
		: Item extends SymbolSchema<symbol> ? UpdateInfoIf<
			[
				IsEmptyList<Info['symbol']['picked']>,
				IsInclude<Info['specificSymbol']['value'], OutputOf<Item>> extends true ? false : true,
			] extends [true, true] ? true : false,
			Info,
			'specificSymbol',
			{ picked: [...Info['specificSymbol']['picked'], CurrentIndex], value: [...Info['specificSymbol']['value'], OutputOf<Item>] }
		>
		: Item extends StringSchema<TemplateLiteralMaterial> ? UpdateInfoIf<
			[
				IsEmptyList<Info['string']['picked']>,
				IsInclude<Info['templateLiteral']['value'], OutputOf<Item>> extends true ? false : true,
			] extends [true, true] ? true : false,
			Info,
			'templateLiteral',
			{ picked: [...Info['templateLiteral']['picked'], CurrentIndex], value: [...Info['templateLiteral']['value'], OutputOf<Item>] }
		>
		: Info,
			OriginalMaterial,
		[...Progress, 0]
	>
	: PickByIndex<
		OriginalMaterial,
		| Info['null' | 'undefined']['picked'][number]
		| (IsEmptyList<Info['string']['picked']> extends true ? Info['specificString' | 'templateLiteral']['picked'][number] : Info['string']['picked'][number])
		| (IsEmptyList<Info['number']['picked']> extends true ? Info['specificNumber']['picked'][number] : Info['number']['picked'][number])
		| (IsEmptyList<Info['bigint']['picked']> extends true ? Info['specificBigint']['picked'][number] : Info['bigint']['picked'][number])
		| (IsEmptyList<Info['boolean']['picked']> extends true ? Info['specificBoolean']['picked'][number] : Info['boolean']['picked'][number])
		| (IsEmptyList<Info['symbol']['picked']> extends true ? Info['specificSymbol']['picked'][number] : Info['symbol']['picked'][number])
	>
	/* eslint-enable style/indent */
function createInfoData() {
	return {
		picked: new Set<number>(),
		value: new Set<any>(),
	}
}
// eslint-disable-next-line complexity
function optimize(material: AnyValSchema[]) {
	const info: MaterialIndexInfoShape<{ picked: Set<number>, value: Set<any> }> = {
		null: createInfoData(),
		undefined: createInfoData(),
		string: createInfoData(),
		number: createInfoData(),
		bigint: createInfoData(),
		boolean: createInfoData(),
		symbol: createInfoData(),
		specificString: createInfoData(),
		specificNumber: createInfoData(),
		specificBigint: createInfoData(),
		specificBoolean: createInfoData(),
		specificSymbol: createInfoData(),
		templateLiteral: createInfoData(),
	}
	for (let index = 0; index < material.length; index++) {
		const item = material[index]!

		if (isAnySchema(item) || isUnknownSchema(item))
			return [item]
		if (isNeverSchema(item))
			continue

		if (isNullSchema(item)) {
			if (info.null.picked.size === 0)
				info.null.picked.add(index)
			continue
		}
		if (isUndefinedSchema(item)) {
			if (info.undefined.picked.size === 0)
				info.undefined.picked.add(index)
			continue
		}
		if (isStringSchema(item) && item.isUnspecific()) {
			if (info.string.picked.size === 0)
				info.string.picked.add(index)
			continue
		}
		if (isNumberSchema(item) && item.isUnspecific()) {
			if (info.number.picked.size === 0)
				info.number.picked.add(index)
			continue
		}
		if (isBigintSchema(item) && item.isUnspecific()) {
			if (info.bigint.picked.size === 0)
				info.bigint.picked.add(index)
			continue
		}
		if (isBooleanSchema(item) && item.isUnspecific()) {
			if (info.boolean.picked.size === 0)
				info.boolean.picked.add(index)
			continue
		}
		if (isSymbolSchema(item) && item.isUnspecific()) {
			if (info.symbol.picked.size === 0)
				info.symbol.picked.add(index)
			continue
		}

		if (isStringSchema(item) && (item.isSpecific() || item.isTemplateLiteral())) {
			if (info.string.picked.size > 0)
				continue

			if (item.isSpecific() && info.specificString.value.has(item._material) === false) {
				info.specificString.picked.add(index)
				info.specificString.value.add(item._material)
				continue
			}

			if (item.isTemplateLiteral() && info.templateLiteral.value.has(item._material.regexp.source) === false) {
				info.templateLiteral.picked.add(index)
				info.templateLiteral.value.add(item._material.regexp.source)
			}

			continue
		}
		if (isNumberSchema(item) && item.isSpecific()) {
			if (info.number.picked.size > 0)
				continue

			if (info.specificNumber.value.has(item._material) === false) {
				info.specificNumber.picked.add(index)
				info.specificNumber.value.add(item._material)
			}

			continue
		}
		if (isBigintSchema(item) && item.isSpecific()) {
			if (info.bigint.picked.size > 0)
				continue

			if (info.specificBigint.value.has(item._material) === false) {
				info.specificBigint.picked.add(index)
				info.specificBigint.value.add(item._material)
			}

			continue
		}
		if (isBooleanSchema(item) && item.isSpecific()) {
			if (info.boolean.picked.size > 0)
				continue

			if (info.specificBoolean.value.has(item._material) === false) {
				info.specificBoolean.picked.add(index)
				info.specificBoolean.value.add(item._material)
			}

			continue
		}
		if (isSymbolSchema(item) && item.isSpecific()) {
			if (info.symbol.picked.size > 0)
				continue

			if (info.specificSymbol.value.has(item._material) === false) {
				info.specificSymbol.picked.add(index)
				info.specificSymbol.value.add(item._material)
			}

			continue
		}
	}

	const picked = new Set<number>([
		...info.null.picked,
		...info.undefined.picked,
		...(info.string.picked.size === 0 ? [...info.specificString.picked, ...info.templateLiteral.picked] : info.string.picked),
		...(info.number.picked.size === 0 ? info.specificNumber.picked : info.number.picked),
		...(info.bigint.picked.size === 0 ? info.specificBigint.picked : info.bigint.picked),
		...(info.boolean.picked.size === 0 ? info.specificBoolean.picked : info.boolean.picked),
		...(info.symbol.picked.size === 0 ? info.specificSymbol.picked : info.symbol.picked),
	])
	return material.filter((_, index) => picked.has(index))
}

export type OptimizeMaterial<Material extends RawUnionSchemaMaterial> = Optimize<ConvertPrimitives<FlattenUnionSchemas<Material>>>
export function optimizeMaterial(material: RawUnionSchemaMaterial) {
	const flattened = flattenMaterial(material)
	const converted = convertPrimitives(flattened)
	return optimize(converted)
}

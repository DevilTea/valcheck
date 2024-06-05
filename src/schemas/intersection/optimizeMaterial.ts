import { type ConvertPrimitives, type IsEmptyList, type IsExclude, type IsNotEmptyList, type PickByIndex, convertPrimitives } from '../../core/utils'
import type { AnyValSchema, MaterialOf, OutputOf } from '../../core/schema'
import { type AnySchema, isAnySchema } from '../any'
import { type BigintSchema, isBigintSchema } from '../bigint'
import { type BooleanSchema, isBooleanSchema } from '../boolean'
import { type NeverSchema, isNeverSchema, never } from '../never'
import { type NullSchema, isNullSchema } from '../null'
import { type NumberSchema, isNumberSchema } from '../number'
import { type StringSchema, type TemplateLiteralMaterial, isStringSchema } from '../string'
import { type SymbolSchema, isSymbolSchema } from '../symbol'
import { type UndefinedSchema, isUndefinedSchema } from '../undefined'
import { type CreateUnionSchema, type UnionSchema, isUnionSchema, union } from '../union'
import type { OptimizeMaterial as OptimizeUnionMaterial } from '../union/optimizeMaterial'
import { type UnknownSchema, isUnknownSchema } from '../unknown'
import { type IntersectionSchema, type RawIntersectionSchemaMaterial, intersection, isIntersectionSchema } from '.'

interface GroupedMaterial {
	unions: UnionSchema[]
	others: AnyValSchema[]
}

type GroupMaterial<
	Material extends AnyValSchema[],
	Grouped extends GroupedMaterial = { unions: [], others: [] },
> = Material extends [infer Item extends AnyValSchema, ...infer Rest extends AnyValSchema[]]
	? Item extends UnionSchema
		? GroupMaterial<Rest, { unions: [...Grouped['unions'], Item], others: Grouped['others'] }>
		: GroupMaterial<Rest, { unions: Grouped['unions'], others: [...Grouped['others'], Item] }>
	: Grouped
function groupMaterial(material: AnyValSchema[]) {
	const unions: UnionSchema[] = []
	const others: AnyValSchema[] = []

	for (const schema of material) {
		if (isUnionSchema(schema))
			unions.push(schema)
		else
			others.push(schema)
	}

	return { unions, others }
}

type FlattenIntersectionSchemas<
	Material extends AnyValSchema[],
	Result extends AnyValSchema[] = [],
> = Material extends [infer Item extends AnyValSchema, ...infer Rest extends AnyValSchema[]]
	? Item extends IntersectionSchema
		? FlattenIntersectionSchemas<Rest, [...Result, ...MaterialOf<Item>]>
		: FlattenIntersectionSchemas<Rest, [...Result, Item]>
	: Result
function flattenMaterial(material: AnyValSchema[]) {
	const result: AnyValSchema[] = []

	for (const schema of material) {
		if (isIntersectionSchema(schema))
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
	number: T
	bigint: T
	boolean: T
	symbol: T

	specificString: T
	specificNumber: T
	specificBigint: T
	specificBoolean: T
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
type NotOnlyTargetExist<
	Info extends MaterialIndexInfo,
	TargetKey extends keyof MaterialIndexInfo,
> = IsNotEmptyList<Info[Exclude<keyof MaterialIndexInfo, TargetKey>]['picked']>
type Optimize<
	Material extends AnyValSchema[],
	Info extends MaterialIndexInfo = MaterialIndexInfoShape<{ picked: [], value: [] }>,
	OriginalMaterial extends AnyValSchema[] = Material,
	Progress extends 0[] = [],
	CurrentIndex extends number = Progress['length'],
> = Material extends [infer Item extends AnyValSchema, ...infer Rest extends AnyValSchema[]]
	/* eslint-disable style/indent */
	? Item extends (AnySchema | NeverSchema) ? [Item]
	: [Item extends NullSchema ? true : false, NotOnlyTargetExist<Info, 'null'>] extends [true, true] ? [NeverSchema]
	: [Item extends UndefinedSchema ? true : false, NotOnlyTargetExist<Info, 'undefined'>] extends [true, true] ? [NeverSchema]
	: [Item extends StringSchema ? true : false, NotOnlyTargetExist<Info, 'string' | 'specificString' | 'templateLiteral'>] extends [true, true] ? [NeverSchema]
	: [Item extends NumberSchema ? true : false, NotOnlyTargetExist<Info, 'number' | 'specificNumber'>] extends [true, true] ? [NeverSchema]
	: [Item extends BigintSchema ? true : false, NotOnlyTargetExist<Info, 'bigint' | 'specificBigint'>] extends [true, true] ? [NeverSchema]
	: [Item extends BooleanSchema ? true : false, NotOnlyTargetExist<Info, 'boolean' | 'specificBoolean'>] extends [true, true] ? [NeverSchema]
	: [Item extends SymbolSchema ? true : false, NotOnlyTargetExist<Info, 'symbol' | 'specificSymbol'>] extends [true, true] ? [NeverSchema]
	: [Item extends StringSchema<string> ? true : false, Info['specificString']['value'] extends [] ? false : IsExclude<Info['specificString']['value'], OutputOf<Item>>] extends [true, true] ? [NeverSchema]
	: [Item extends NumberSchema<number> ? true : false, Info['specificNumber']['value'] extends [] ? false : IsExclude<Info['specificNumber']['value'], OutputOf<Item>>] extends [true, true] ? [NeverSchema]
	: [Item extends BigintSchema<bigint> ? true : false, Info['specificBigint']['value'] extends [] ? false : IsExclude<Info['specificBigint']['value'], OutputOf<Item>>] extends [true, true] ? [NeverSchema]
	: [Item extends BooleanSchema<boolean> ? true : false, Info['specificBoolean']['value'] extends [] ? false : IsExclude<Info['specificBoolean']['value'], OutputOf<Item>>] extends [true, true] ? [NeverSchema]
	: [Item extends SymbolSchema<symbol> ? true : false, Info['specificSymbol']['value'] extends [] ? false : IsExclude<Info['specificSymbol']['value'], OutputOf<Item>>] extends [true, true] ? [NeverSchema]
	: Optimize<
		Rest,
		| Item extends UnknownSchema ? Info
		: Item extends NullSchema ? UpdateInfoIf<IsEmptyList<Info['null']['picked']>, Info, 'null', { picked: [CurrentIndex], value: [null] }>
		: Item extends UndefinedSchema ? UpdateInfoIf<IsEmptyList<Info['undefined']['picked']>, Info, 'undefined', { picked: [CurrentIndex], value: [undefined] }>
		: Item extends StringSchema<null> ? UpdateInfoIf<
			[
				IsEmptyList<Info['string']['picked']>,
				IsEmptyList<Info['specificString']['picked']>,
				IsEmptyList<Info['templateLiteral']['picked']>,
			] extends [true, true, true] ? true : false,
			Info,
			'string',
			{ picked: [CurrentIndex], value: [string] }
		>
		: Item extends NumberSchema<null> ? UpdateInfoIf<
			[
				IsEmptyList<Info['number']['picked']>,
				IsEmptyList<Info['specificNumber']['picked']>,
			] extends [true, true] ? true : false,
			Info,
			'number',
			{ picked: [CurrentIndex], value: [number] }
		>
		: Item extends BigintSchema<null> ? UpdateInfoIf<
			[
				IsEmptyList<Info['bigint']['picked']>,
				IsEmptyList<Info['specificBigint']['picked']>,
			] extends [true, true] ? true : false,
			Info,
			'bigint',
			{ picked: [CurrentIndex], value: [bigint] }
		>
		: Item extends BooleanSchema<null> ? UpdateInfoIf<
			[
				IsEmptyList<Info['boolean']['picked']>,
				IsEmptyList<Info['specificBoolean']['picked']>,
			] extends [true, true] ? true : false,
			Info,
			'boolean',
			{ picked: [CurrentIndex], value: [boolean] }
		>
		: Item extends SymbolSchema<null> ? UpdateInfoIf<
			[
				IsEmptyList<Info['symbol']['picked']>,
				IsEmptyList<Info['specificSymbol']['picked']>,
			] extends [true, true] ? true : false,
			Info,
			'symbol',
			{ picked: [CurrentIndex], value: [symbol] }
		>
		: Item extends StringSchema<string> ? UpdateInfoIf<IsEmptyList<Info['specificString']['picked']>, Info, 'specificString', { picked: [CurrentIndex], value: [OutputOf<Item>] }>
		: Item extends NumberSchema<number> ? UpdateInfoIf<IsEmptyList<Info['specificNumber']['picked']>, Info, 'specificNumber', { picked: [CurrentIndex], value: [OutputOf<Item>] }>
		: Item extends BigintSchema<bigint> ? UpdateInfoIf<IsEmptyList<Info['specificBigint']['picked']>, Info, 'specificBigint', { picked: [CurrentIndex], value: [OutputOf<Item>] }>
		: Item extends BooleanSchema<boolean> ? UpdateInfoIf<IsEmptyList<Info['specificBoolean']['picked']>, Info, 'specificBoolean', { picked: [CurrentIndex], value: [OutputOf<Item>] }>
		: Item extends SymbolSchema<symbol> ? UpdateInfoIf<IsEmptyList<Info['specificSymbol']['picked']>, Info, 'specificSymbol', { picked: [CurrentIndex], value: [OutputOf<Item>] }>
		: Item extends StringSchema<TemplateLiteralMaterial> ? UpdateInfoIf<true, Info, 'templateLiteral', { picked: [...Info['templateLiteral']['picked'], CurrentIndex], value: [...Info['templateLiteral']['value'], OutputOf<Item>] }>
		: Info,
		OriginalMaterial,
		[...Progress, 0]
	>
	: PickByIndex<
		OriginalMaterial,
		| Info['null' | 'undefined']['picked'][number]
		| (IsEmptyList<Info['specificString' | 'templateLiteral']['picked']> extends true ? Info['string']['picked'][number] : Info['specificString' | 'templateLiteral']['picked'][number])
		| (IsEmptyList<Info['specificNumber']['picked']> extends true ? Info['number']['picked'][number] : Info['specificNumber']['picked'][number])
		| (IsEmptyList<Info['specificBigint']['picked']> extends true ? Info['bigint']['picked'][number] : Info['specificBigint']['picked'][number])
		| (IsEmptyList<Info['specificBoolean']['picked']> extends true ? Info['boolean']['picked'][number] : Info['specificBoolean']['picked'][number])
		| (IsEmptyList<Info['specificSymbol']['picked']> extends true ? Info['symbol']['picked'][number] : Info['specificSymbol']['picked'][number])
	>
	/* eslint-enable style/indent */
function createInfoData() {
	return {
		picked: new Set<number>(),
		value: new Set<any>(),
	}
}
type MaterialIndexInfoRuntime = MaterialIndexInfoShape<{ picked: Set<number>, value: Set<any> }>
function notOnlyTargetExist(info: MaterialIndexInfoRuntime, targetKey: keyof MaterialIndexInfoRuntime) {
	return info[targetKey].picked.size > 0
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

		if (isUnknownSchema(item))
			continue

		if (isAnySchema(item) || isNeverSchema(item))
			return [item]

		if (
			(isNullSchema(item) && notOnlyTargetExist(info, 'null'))
			|| (isUndefinedSchema(item) && notOnlyTargetExist(info, 'undefined'))
			|| (isStringSchema(item) && item.isUnspecific() && (notOnlyTargetExist(info, 'string') || notOnlyTargetExist(info, 'specificString') || notOnlyTargetExist(info, 'templateLiteral')))
			|| (isNumberSchema(item) && item.isUnspecific() && (notOnlyTargetExist(info, 'number') || notOnlyTargetExist(info, 'specificNumber')))
			|| (isBigintSchema(item) && item.isUnspecific() && (notOnlyTargetExist(info, 'bigint') || notOnlyTargetExist(info, 'specificBigint')))
			|| (isBooleanSchema(item) && item.isUnspecific() && (notOnlyTargetExist(info, 'boolean') || notOnlyTargetExist(info, 'specificBoolean')))
			|| (isSymbolSchema(item) && item.isUnspecific() && (notOnlyTargetExist(info, 'symbol') || notOnlyTargetExist(info, 'specificSymbol')))
			|| (isStringSchema(item) && item.isSpecific() && info.specificString.value.size > 0 && info.specificString.value.has(item._material) === false)
			|| (isNumberSchema(item) && item.isSpecific() && info.specificNumber.value.size > 0 && info.specificNumber.value.has(item._material) === false)
			|| (isBigintSchema(item) && item.isSpecific() && info.specificBigint.value.size > 0 && info.specificBigint.value.has(item._material) === false)
			|| (isBooleanSchema(item) && item.isSpecific() && info.specificBoolean.value.size > 0 && info.specificBoolean.value.has(item._material) === false)
			|| (isSymbolSchema(item) && item.isSpecific() && info.specificSymbol.value.size > 0 && info.specificSymbol.value.has(item._material) === false)
		)
			return [never()]

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
			if (info.string.picked.size === 0 && info.specificString.picked.size === 0 && info.templateLiteral.picked.size === 0)
				info.string.picked.add(index)
			continue
		}
		if (isNumberSchema(item) && item.isUnspecific()) {
			if (info.number.picked.size === 0 && info.specificNumber.picked.size === 0)
				info.number.picked.add(index)
			continue
		}
		if (isBigintSchema(item) && item.isUnspecific()) {
			if (info.bigint.picked.size === 0 && info.specificBigint.picked.size === 0)
				info.bigint.picked.add(index)
			continue
		}
		if (isBooleanSchema(item) && item.isUnspecific()) {
			if (info.boolean.picked.size === 0 && info.specificBoolean.picked.size === 0)
				info.boolean.picked.add(index)
			continue
		}
		if (isSymbolSchema(item) && item.isUnspecific()) {
			if (info.symbol.picked.size === 0 && info.specificSymbol.picked.size === 0)
				info.symbol.picked.add(index)
			continue
		}

		if (isStringSchema(item) && item.isSpecific()) {
			if (info.specificString.value.size === 0)
				info.specificString.picked.add(index)
			info.specificString.value.add(item._material)
			continue
		}
		if (isNumberSchema(item) && item.isSpecific()) {
			if (info.specificNumber.value.size === 0)
				info.specificNumber.picked.add(index)
			info.specificNumber.value.add(item._material)
			continue
		}
		if (isBigintSchema(item) && item.isSpecific()) {
			if (info.specificBigint.value.size === 0)
				info.specificBigint.picked.add(index)
			info.specificBigint.value.add(item._material)
			continue
		}
		if (isBooleanSchema(item) && item.isSpecific()) {
			if (info.specificBoolean.value.size === 0)
				info.specificBoolean.picked.add(index)
			info.specificBoolean.value.add(item._material)
			continue
		}
		if (isSymbolSchema(item) && item.isSpecific()) {
			if (info.specificSymbol.value.size === 0)
				info.specificSymbol.picked.add(index)
			info.specificSymbol.value.add(item._material)
			continue
		}
		if (isStringSchema(item) && item.isTemplateLiteral()) {
			info.templateLiteral.picked.add(index)
			info.templateLiteral.value.add(item._material.regexp.source)
			continue
		}
	}

	const picked = new Set<number>([
		...info.null.picked,
		...info.undefined.picked,
		...((info.specificString.picked.size === 0 && info.templateLiteral.picked.size === 0) ? info.string.picked : [...info.specificString.picked, ...info.templateLiteral.picked]),
		...(info.specificNumber.picked.size === 0 ? info.number.picked : info.specificNumber.picked),
		...(info.specificBigint.picked.size === 0 ? info.bigint.picked : info.specificBigint.picked),
		...(info.specificBoolean.picked.size === 0 ? info.boolean.picked : info.specificBoolean.picked),
		...(info.specificSymbol.picked.size === 0 ? info.symbol.picked : info.specificSymbol.picked),
	])
	return material.filter((_, index) => picked.has(index))
}

type IntersectWithUnionItems<
	Item extends AnyValSchema,
	UnionItems extends AnyValSchema[],
	Result extends AnyValSchema[] = [],
> = UnionItems extends [infer UnionItem extends AnyValSchema, ...infer Rest extends AnyValSchema[]]
	? Optimize<FlattenIntersectionSchemas<[Item, UnionItem]>> extends infer Optimized extends AnyValSchema[]
		? IntersectWithUnionItems<Item, Rest, [...Result, Optimized extends { length: 1 } ? Optimized[0] : IntersectionSchema<Optimized>]>
		: never
	: Result
function intersectWithUnionItems(item: AnyValSchema, unionItems: AnyValSchema[]) {
	const result: AnyValSchema[] = []

	for (const unionItem of unionItems) {
		const optimized = optimize(flattenMaterial([item, unionItem]))
		result.push(optimized.length === 1 ? optimized[0]! : intersection(optimized))
	}

	return result
}

type IntersectTwoUnions<
	UnionItemsA extends AnyValSchema[],
	UnionItemsB extends AnyValSchema[],
	Result extends AnyValSchema[] = [],
> = UnionItemsA extends [infer ItemA extends AnyValSchema, ...infer RestA extends AnyValSchema[]]
	? IntersectTwoUnions<RestA, UnionItemsB, [...Result, ...IntersectWithUnionItems<ItemA, UnionItemsB>]>
	: Result
function intersectTwoUnions(unionItemsA: AnyValSchema[], unionItemsB: AnyValSchema[]) {
	const result: AnyValSchema[] = []

	for (const itemA of unionItemsA)
		result.push(...intersectWithUnionItems(itemA, unionItemsB))

	return result
}

type MergeUnions<
	Unions extends UnionSchema[],
	Result extends AnyValSchema[] = [],
> = Unions extends [infer Union extends UnionSchema, ...infer Rest extends UnionSchema[]]
	? Result extends []
		? MergeUnions<Rest, MaterialOf<Union>>
		: MergeUnions<Rest, IntersectTwoUnions<Result, MaterialOf<Union>>>
	: Result
function mergeUnions(unions: UnionSchema[]) {
	const result: AnyValSchema[] = []

	for (const union of unions) {
		if (result.length === 0)
			result.push(...union._material)
		else
			result.push(...intersectTwoUnions(result, union._material))
	}

	return result
}

export type OptimizeMaterial<
	RawMaterial extends RawIntersectionSchemaMaterial,
	Material extends AnyValSchema[] = ConvertPrimitives<RawMaterial>,
	Grouped extends GroupedMaterial = GroupMaterial<Material>,
	OptimizedOthers extends AnyValSchema[] = Optimize<FlattenIntersectionSchemas<Grouped['others']>>,
> = Grouped['unions'] extends []
	? OptimizedOthers
	: [CreateUnionSchema<
		OptimizeUnionMaterial<
			IntersectWithUnionItems<
				IntersectionSchema<OptimizedOthers>,
				MergeUnions<Grouped['unions']>
			>
		>
	>]

export function optimizeMaterial(rawMaterial: RawIntersectionSchemaMaterial) {
	const material = convertPrimitives(rawMaterial)
	const grouped = groupMaterial(material)
	const optimizedOthers = optimize(flattenMaterial(grouped.others))

	if (grouped.unions.length === 0)
		return optimizedOthers

	return [union(intersectWithUnionItems(
		intersection(optimizedOthers),
		mergeUnions(grouped.unions),
	))]
}

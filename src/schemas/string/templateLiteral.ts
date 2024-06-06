import type { OutputOf,
} from '../../core/schema'
import { type As, isPrimitive } from '../../core/utils'
import { type BigintSchema, isBigintSchema } from '../bigint'
import { type BooleanSchema, isBooleanSchema } from '../boolean'
import { type NumberSchema, isNumberSchema } from '../number'
import { type CreateUnionSchema, type UnionSchema, isUnionSchema, union } from '../union'
import { type NullSchema, isNullSchema } from '../null'
import { type UndefinedSchema, isUndefinedSchema } from '../undefined'
import { StringSchema, isStringSchema, string } from '.'

type RawTemplateLiteralMaterialItem = string | number | bigint | boolean | null | undefined
	| StringSchema | NumberSchema | BigintSchema | BooleanSchema | NullSchema | UndefinedSchema
	| UnionSchema<(StringSchema | NumberSchema | BigintSchema | BooleanSchema | NullSchema | UndefinedSchema)[]>
export type RawTemplateLiteralMaterial = RawTemplateLiteralMaterialItem[]

type RawTemplatePartial = StringSchema<null | string> | NumberSchema<null> | BigintSchema<null> | BooleanSchema<null>
	| UnionSchema<(StringSchema<null | string> | NumberSchema<null> | BigintSchema<null> | BooleanSchema<null>)[]>
type _RawTemplateLiteralMaterialToRawPartials<Material extends RawTemplateLiteralMaterial> = Material extends [infer Item, ...infer Rest extends RawTemplateLiteralMaterial]
	? [Item] extends [string | number | bigint | boolean | null | undefined]
			? [StringSchema<`${Item}`>, ..._RawTemplateLiteralMaterialToRawPartials<Rest>]
			: [Item] extends [StringSchema<string> | NumberSchema<number> | BigintSchema<bigint> | BooleanSchema<boolean> | NullSchema | UndefinedSchema]
					? [StringSchema<`${OutputOf<Item>}`>, ..._RawTemplateLiteralMaterialToRawPartials<Rest>]
					: [Item, ..._RawTemplateLiteralMaterialToRawPartials<Rest>]
	: []
type RawTemplateLiteralMaterialToRawPartials<Material extends RawTemplateLiteralMaterial> = As<RawTemplatePartial[], _RawTemplateLiteralMaterialToRawPartials<Material>>

// Resolve Partials to Paths
type ResolvedPartial = StringSchema<null | string> | NumberSchema<null> | BigintSchema<null> | BooleanSchema<null>
type ResolvedPath = ResolvedPartial[]
type AppendPaths<Paths extends ResolvedPath[], Item extends ResolvedPath[number]> = Paths extends [infer Path extends ResolvedPath, ...infer Rest extends ResolvedPath[]]
	? [[...Path, Item], ...AppendPaths<Rest, Item>]
	: []
type ConcatPathsWithPaths_InnerLoop<Path1 extends ResolvedPath, Paths2 extends ResolvedPath[]> = Paths2 extends [infer Path2 extends ResolvedPath, ...infer Rest2 extends ResolvedPath[]]
	? [[...Path1, ...Path2], ...ConcatPathsWithPaths_InnerLoop<Path1, Rest2>]
	: []
type ConcatPathsWithPaths<Paths1 extends ResolvedPath[], Paths2 extends ResolvedPath[], Result extends ResolvedPath[] = []> = Paths1 extends [infer Path1 extends ResolvedPath, ...infer Rest1 extends ResolvedPath[]]
	? ConcatPathsWithPaths<
		Rest1,
		Paths2,
		[...Result, ...ConcatPathsWithPaths_InnerLoop<Path1, Paths2>]
	>
	: Result
type AppendPathsWithUnion<Paths extends ResolvedPath[], Union extends RawTemplatePartial[]> = Union extends [infer Item extends RawTemplatePartial, ...infer Rest extends RawTemplatePartial[]]
	? [...ConcatPathsWithPaths<Paths, ResolvePartials<[Item]>>, ...AppendPathsWithUnion<Paths, Rest>]
	: []
type ResolvePartials<Partials extends RawTemplatePartial[], Result extends ResolvedPath[] = [[]]> = Partials extends [infer Item extends RawTemplatePartial, ...infer Rest extends RawTemplatePartial[]]
	/* eslint-disable style/indent */
	?
		| Item extends StringSchema<TemplateLiteralMaterial> ? ResolvePartials<Rest, ConcatPathsWithPaths<Result, ResolvePartials<Item['_material']['partials']>>>
		: Item extends BooleanSchema<null> ? ResolvePartials<Rest, AppendPathsWithUnion<Result, [StringSchema<'true'>, StringSchema<'false'>]>>
		: Item extends ResolvedPartial ? ResolvePartials<Rest, AppendPaths<Result, Item>>
		: Item extends UnionSchema<infer Union extends RawTemplatePartial[]> ? ResolvePartials<Rest, AppendPathsWithUnion<Result, Union>>
		: never
	: Result
	/* eslint-enable style/indent */
function resolvePartials(rawPartials: RawTemplatePartial[]): ResolvedPath[] {
	const result: ResolvedPath[] = [[]]
	rawPartials.forEach((partial) => {
		if (isStringSchema(partial) && partial.isTemplateLiteral()) {
			const resolved = resolvePartials(partial._material.partials)
			const newResult: ResolvedPath[] = []
			result.forEach((path) => {
				resolved.forEach((resolvedPath) => {
					newResult.push([...path, ...resolvedPath])
				})
			})
			result.splice(0, result.length, ...newResult)
			return
		}

		if (isBooleanSchema(partial) && partial.isUnspecific()) {
			const newResult: ResolvedPath[] = []
			result.forEach((path) => {
				newResult.push([...path, string('true')], [...path, string('false')])
			})
			result.splice(0, result.length, ...newResult)
			return
		}

		if (
			(isStringSchema(partial))
			|| (isNumberSchema(partial))
			|| (isBigintSchema(partial))
		) {
			result.forEach(path => path.push(partial))
			return
		}

		if (isUnionSchema(partial)) {
			const newResult: ResolvedPath[] = []
			result.forEach((path) => {
				partial._material.forEach((unionPartial) => {
					const resolved = resolvePartials([unionPartial])
					resolved.forEach((resolvedPath) => {
						newResult.push([...path, ...resolvedPath])
					})
				})
			})
			result.splice(0, result.length, ...newResult)
		}
	})
	return result
}

// Optimize Resolved Paths
type OptimizedPath = TemplatePartial[]
interface OptimizedResult {
	partials: OptimizedPath
	regexp: RegExp
}
type OptimizePath<Path extends ResolvedPath, ResultPath extends OptimizedPath = []> = Path extends [infer Item extends ResolvedPartial, ...infer Rest extends ResolvedPath]
	? OptimizePath<
		Rest,
		Item extends StringSchema<null> | NumberSchema<null> | BooleanSchema<null> | BigintSchema<null>
			? [...ResultPath, Item]
			: Item extends StringSchema<string>
				? ResultPath extends [...infer Rest extends OptimizedPath, infer Last extends StringSchema<string>]
					? [...Rest, StringSchema<`${Last['_material']}${Item['_material']}`>]
					: [...ResultPath, Item]
				: never
	>
	: { partials: ResultPath, regexp: RegExp }
type OptimizedPaths<Paths extends ResolvedPath[], Result extends OptimizedResult[] = []> = Paths extends [infer Path extends ResolvedPath, ...infer Rest extends ResolvedPath[]]
	? OptimizedPaths<Rest, [...Result, OptimizePath<Path>]>
	: Result
function optimizedPathToREStr(optimizedPath: OptimizedPath) {
	const body = optimizedPath.map((item) => {
		if (isStringSchema(item) && item.isUnspecific())
			return '(.+)'

		if (isNumberSchema(item) && item.isUnspecific())
			return '([+-]?\\d+(?:\\.\\d+)?)'

		if (isBigintSchema(item) && item.isUnspecific())
			return '([+-]?\\d+)'

		if (isBooleanSchema(item) && item.isUnspecific())
			return '(true|false)'

		if (
			(isStringSchema(item) || isNumberSchema(item) || isBigintSchema(item) || isBooleanSchema(item))
			&& item.isSpecific()
		)
			return item._material

		throw new Error('Unhandled partial')
	}).join('')

	return `^${body}$`
}
function optimizePaths(resolvedPaths: ResolvedPath[]) {
	const record: Record<string, { partials: OptimizedPath, regexp: RegExp }> = {}
	for (const resolvedPath of resolvedPaths) {
		const optimizedPath: OptimizedPath = []
		for (const partial of resolvedPath) {
			if (partial.isUnspecific()) {
				optimizedPath.push(partial)
				continue
			}

			if (partial.isSpecific() === false) {
				// Skip unspecific partials, should not happen
				continue
			}

			const str = partial._material.toString()

			if (optimizedPath.length === 0) {
				optimizedPath.push(string(str))
				continue
			}

			const lastPartial = optimizedPath[optimizedPath.length - 1]!
			if (lastPartial.isSpecific()) {
				lastPartial._material += str
				continue
			}
		}
		const reStr = optimizedPathToREStr(optimizedPath)
		if (record[reStr] == null) {
			record[reStr] = {
				partials: optimizedPath,
				regexp: new RegExp(reStr),
			}
		}
	}
	return Object.values(record)
}

// Create Schema
type CreateSchemaByOptimizedResult<Result extends OptimizedResult> = Result['partials'] extends { length: 0 }
	? StringSchema<null>
	: Result['partials'] extends [infer Item extends StringSchema<null | string>]
		? Item
		: StringSchema<Result>
type CreateSchemasByOptimizedResults<Results extends OptimizedResult[]> = Results extends [infer Result extends OptimizedResult, ...infer Rest extends OptimizedResult[]]
	? [CreateSchemaByOptimizedResult<Result>, ...CreateSchemasByOptimizedResults<Rest>]
	: []
type CreateFinalSchema<Schemas extends StringSchema[]> = Schemas extends { length: 0 }
	? StringSchema<null>
	: Schemas extends { length: 1 }
		? Schemas[0]
		: CreateUnionSchema<Schemas>
export type CreateTemplateLiteralSchema<Material extends RawTemplateLiteralMaterial> = CreateFinalSchema<
	CreateSchemasByOptimizedResults<
		OptimizedPaths<
			ResolvePartials<
				RawTemplateLiteralMaterialToRawPartials<
					Material
				>
			>
		>
	>
>
export function createTemplateLiteral(material: RawTemplateLiteralMaterial) {
	const rawPartials = material.map((item) => {
		if (isPrimitive(item))
			return string(`${item}`)

		if (
			(isNumberSchema(item) && item.isSpecific())
			|| (isBigintSchema(item) && item.isSpecific())
			|| (isBooleanSchema(item) && item.isSpecific())
		)
			return string(`${item._material}`)

		if (isNullSchema(item))
			return string('null')

		if (isUndefinedSchema(item))
			return string('undefined')

		return item
	}) as RawTemplatePartial[]

	const resolvedPaths = resolvePartials(rawPartials)

	const optimizedResults = optimizePaths(resolvedPaths)

	if (optimizedResults.length === 0)
		return string(null)

	const schemas = optimizedResults.map((result) => {
		if (result.partials.length === 0)
			return string(null)

		if (result.partials.length === 1 && isStringSchema(result.partials[0]))
			return result.partials[0]!

		return new StringSchema(result)
	})

	if (schemas.length === 1)
		return schemas[0]!

	return union(...schemas)
}

export type TemplateLiteralMaterial = OptimizedResult
export type TemplatePartial = StringSchema<null | string> | NumberSchema<null> | BigintSchema<null> | BooleanSchema<null>
export type TemplatePartialsToOutput<Partials extends TemplatePartial[]> = Partials extends [infer Item extends RawTemplatePartial, ...infer Rest extends TemplatePartial[]]
	? `${OutputOf<Item>}${TemplatePartialsToOutput<Rest>}`
	: ''

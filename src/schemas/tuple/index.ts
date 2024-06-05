import { type AnyValSchema, type AnyValSchemaThatOutputs, BaseValSchema, type OutputOf, type SchemaPathOf, implementExecuteFn } from '../../core/schema'
import { type ConvertPrimitives, type Primitive, convertPrimitives } from '../../core/utils'

const REST_PATH = '<rest>'

type Item = AnyValSchema
type RestItem = ['...', AnyValSchemaThatOutputs<any[]>]

type TupleSchemaMaterial = [
	head: Item[],
	rest: [] | [RestItem[1]],
	tail: Item[],
]

type TupleSchemaOutput_Items<Items extends Item[]> = { [index in keyof Items]: OutputOf<Items[index]> } extends infer T extends any[]
	? T
	: never
type TupleSchemaOutput_Rest<Rest extends [] | [RestItem[1]]> = Rest extends [RestItem[1]]
	? OutputOf<Rest[0]>
	: []

type TupleSchemaOutput<Material extends TupleSchemaMaterial> = [
	...TupleSchemaOutput_Items<Material[0]>,
	...TupleSchemaOutput_Rest<Material[1]>,
	...TupleSchemaOutput_Items<Material[2]>,
]

type IndexFromStartOf<Tuple extends any[], Result extends number[] = []> = Tuple extends [any, ...infer Rest extends any[]]
	? IndexFromStartOf<Rest, [...Result, Result['length']]>
	: Result
type IndexFromEndOf<Tuple extends any[], Result extends number[] = []> = Tuple extends [any, ...infer Rest extends any[]]
	? IndexFromEndOf<Rest, [...Result, `-${Tuple['length']}` extends `${infer N extends number}` ? N : never]>
	: Result

type TupleSchemaPath_Head<Head extends Item[], Index extends number = IndexFromStartOf<Head>[number]> = Index extends any
	? [Index, ...SchemaPathOf<Head[Index]>]
	: never
type TupleSchemaPath_Rest<Rest extends [] | [RestItem[1]]> = Rest extends [RestItem[1]]
	? [typeof REST_PATH, ...SchemaPathOf<Rest[0]>]
	: never
type TupleSchemaPath_Tail<Tail extends Item[], Index extends number = IndexFromEndOf<Tail>[number]> = Index extends any
	? [Index, ...SchemaPathOf<Tail[Index]>]
	: never
type TupleSchemaPath<Material extends TupleSchemaMaterial> = [
	TupleSchemaPath_Head<Material[0]>,
	TupleSchemaPath_Rest<Material[1]>,
	TupleSchemaPath_Tail<Material[2]>,
][number]

export class TupleSchema<Material extends TupleSchemaMaterial = TupleSchemaMaterial> extends BaseValSchema({
	Name: 'tuple',
	Issues: ['UNEXPECTED_INPUT', 'UNEXPECTED_TUPLE_LENGTH', 'UNEXPECTED_TUPLE_ITEM'],
})<{
	Material: Material
	SchemaPath: TupleSchemaPath<Material>
	Input: any
	Output: TupleSchemaOutput<Material>
}> {
	constructor(material: Material) {
		super(material)
	}
}

implementExecuteFn(
	TupleSchema,
	({ schema, input, context, fail, pass }) => {
		if (!Array.isArray(input))
			return fail('UNEXPECTED_INPUT', input)

		const material = schema._material
		const hasRest = material[1].length > 0
		if (
			(hasRest && input.length < material[0].length + material[2].length)
			|| (!hasRest && input.length !== material[0].length)
		)
			return fail('UNEXPECTED_TUPLE_LENGTH', input)

		let itemIndex = 0
		let failed = false
		const inputParts: [any[], any[], any[]] = hasRest
			? [
					input.slice(0, material[0].length),
					input.slice(material[0].length, -material[2].length),
					input.slice(-material[2].length),
				]
			: [
					input.slice(0, material[0].length),
					[],
					[],
				]
		const path = [...context.currentPath]
		for (let partIndex: 0 | 1 | 2 = 0; partIndex < inputParts.length; partIndex++) {
			const inputPart = inputParts[partIndex]!
			const materialPart = material[partIndex]!
			for (let indexInPart = 0; indexInPart < inputPart.length; indexInPart++) {
				context.currentPath = [...path, itemIndex]
				const item = inputPart[indexInPart]!
				const schema = materialPart[indexInPart]!
				const result = schema.execute(item, context)
				if (result.type === 'failed')
					failed = true

				itemIndex++
			}
		}

		context.currentPath = path

		if (failed)
			return fail()

		return pass(input)
	},
)

type RawItem = Primitive | Item
type RawTupleSchemaMaterial = [
	// Case 1: [...any[]]
	[RawItem[]] | [RestItem],
	// Case 2: [...any[], ...]
	[RestItem, RawItem[]],
	// Case 3: [..., ...any[]]
	[[...RawItem[]], RestItem],
	// Case 4: [..., ...any[], ...]
	[RawItem[], RestItem, RawItem[]],
][number]

function isRestItem(item: any): item is RestItem {
	return Array.isArray(item) && item.length === 2 && item[0] === '...'
}

function resolveMaterial(rawMaterial: RawTupleSchemaMaterial): TupleSchemaMaterial {
	const restIndex = rawMaterial.findIndex(isRestItem)
	const hasRest = restIndex !== -1

	if (hasRest) {
		const restIndex = rawMaterial.findIndex(isRestItem)
		const head = restIndex === 0
			? []
			: convertPrimitives(rawMaterial[0] as RawItem[])
		const rest = [(rawMaterial[restIndex] as RestItem)[1]] as [RestItem[1]]
		const tail = rawMaterial[restIndex + 1] == null
			? []
			: convertPrimitives(rawMaterial[restIndex + 1] as RawItem[])
		return [head, rest, tail]
	}

	const head = convertPrimitives(rawMaterial[0] as RawItem[])
	return [head, [], []]
}

export function tuple<Head extends RawItem[]>(head: [...Head]): TupleSchema<[ConvertPrimitives<Head>, [], []]>
export function tuple<Head extends RawItem[], Rest extends RestItem>(head: [...Head], rest: Rest): TupleSchema<[ConvertPrimitives<Head>, [Rest[1]], []]>
export function tuple<Head extends RawItem[], Rest extends RestItem, Tail extends RawItem[]>(head: [...Head], rest: Rest, tail: [...Tail]): TupleSchema<[ConvertPrimitives<Head>, [Rest[1]], ConvertPrimitives<Tail>]>
export function tuple<Rest extends RestItem>(rest: Rest): TupleSchema<[[], [Rest[1]], []]>
export function tuple<Rest extends RestItem, Tail extends RawItem[]>(rest: Rest, tail: [...Tail]): TupleSchema<[[], [Rest[1]], ConvertPrimitives<Tail>]>
export function tuple(...args: RawTupleSchemaMaterial) {
	const resolvedMaterial = resolveMaterial(args)
	return new TupleSchema(resolvedMaterial)
}

export function isTupleSchema(schema: any): schema is TupleSchema {
	return schema instanceof TupleSchema
}

import { type AnyValSchema, BaseValSchemaWithMaterial, type OutputOf, implementExecuteFn } from '../../core/schema'
import { type As, type OptionalItem, type Primitive, type PrimitiveValueToSchema, type RestItem, isOptionalItem, isPrimitive, isRestItem, toPrimitiveSchema } from '../../core/utils'

type Item = AnyValSchema | OptionalItem<AnyValSchema>

type TupleSchemaMaterial = [
	head: Item[],
	rest: [] | [RestItem[1]],
	tail: Item[],
]

type TupleSchemaOutput_Items<Items extends Item[]> = Items extends [infer Head extends Item, ...infer Rest extends Item[]]
	? Head extends OptionalItem<AnyValSchema>
		? [OutputOf<Head[1]>?, ...TupleSchemaOutput_Items<Rest>]
		: [OutputOf<Head>, ...TupleSchemaOutput_Items<Rest>]
	: []
type TupleSchemaOutput_Rest<Rest extends [] | [RestItem[1]]> = Rest extends [RestItem[1]]
	? OutputOf<Rest[0]>
	: []

type TupleSchemaOutput<Material extends TupleSchemaMaterial> = [
	...TupleSchemaOutput_Items<Material[0]>,
	...TupleSchemaOutput_Rest<Material[1]>,
	...TupleSchemaOutput_Items<Material[2]>,
]

export class TupleSchema<Material extends TupleSchemaMaterial = TupleSchemaMaterial> extends BaseValSchemaWithMaterial({
	Name: 'tuple',
	Issues: ['UNEXPECTED_INPUT', 'UNEXPECTED_TUPLE_LENGTH', 'UNEXPECTED_TUPLE_ITEM'],
})<{
	Material: Material
	Input: any
	Output: TupleSchemaOutput<Material>
}> {}

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
				const inputItem = inputPart[indexInPart]!
				const materialItem = materialPart[indexInPart]!

				let result
				if (isOptionalItem(materialItem) && inputItem !== undefined)
					result = materialItem[1].execute(inputItem, context)

				else if (isOptionalItem(materialItem))
					result = { type: 'passed', value: undefined }

				else
					result = materialItem.execute(inputItem, context)

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

export function isTupleSchema(schema: any): schema is TupleSchema {
	return schema instanceof TupleSchema
}

type RawItem = Primitive | AnyValSchema | OptionalItem<Primitive | AnyValSchema>
type RawTupleSchemaMaterial =
	// Case 1: [...any[]]
	| [RawItem[]]
	| [RestItem]
	// Case 2: [...any[], ...]
	| [RestItem, RawItem[]]
	// Case 3: [..., ...any[]]
	| [[...RawItem[]], RestItem]
	// Case 4: [..., ...any[], ...]
	| [RawItem[], RestItem, RawItem[]]

function resolveRawItems(rawItems: RawItem[]) {
	return rawItems.map((item) => {
		if (isOptionalItem(item) && isPrimitive(item[1]))
			return ['?', toPrimitiveSchema(item[1])]

		if (isPrimitive(item))
			return toPrimitiveSchema(item)

		return item
	}) as Item[]
}

type ResolveRawItems<RawItems extends RawItem[]> = RawItems extends [infer I extends RawItem, ...infer Rest extends RawItem[]]
	? I extends OptionalItem<Primitive>
		? [OptionalItem<PrimitiveValueToSchema<I[1]>>, ...ResolveRawItems<Rest>]
		: I extends Primitive
			? [PrimitiveValueToSchema<I>, ...ResolveRawItems<Rest>]
			: [I, ...ResolveRawItems<Rest>]
	: []

function resolveMaterial(rawMaterial: RawTupleSchemaMaterial): TupleSchemaMaterial {
	const restIndex = rawMaterial.findIndex(isRestItem)
	const hasRest = restIndex !== -1

	if (hasRest) {
		const restIndex = rawMaterial.findIndex(isRestItem)
		const head = restIndex === 0
			? []
			: resolveRawItems(rawMaterial[0] as RawItem[])
		const rest = [(rawMaterial[restIndex] as RestItem)[1]] as [RestItem[1]]
		const tail = rawMaterial[restIndex + 1] == null
			? []
			: resolveRawItems(rawMaterial[restIndex + 1] as RawItem[])
		return [head, rest, tail]
	}

	const head = resolveRawItems(rawMaterial[0] as RawItem[])
	return [head, [], []]
}

export function tuple<
	RawHead extends RawItem[],
	Head extends Item[] = As<Item[], ResolveRawItems<RawHead>>,
>(head: [...RawHead]): TupleSchema<[Head, [], []]>
export function tuple<
	RawHead extends RawItem[],
	Rest extends RestItem,
	Head extends Item[] = As<Item[], ResolveRawItems<RawHead>>,
>(head: [...RawHead], rest: Rest): TupleSchema<[Head, [Rest[1]], []]>
export function tuple<
	RawHead extends RawItem[],
	Rest extends RestItem,
	RawTail extends RawItem[],
	Head extends Item[] = As<Item[], ResolveRawItems<RawHead>>,
	Tail extends Item[] = As<Item[], ResolveRawItems<RawTail>>,
>(head: [...RawHead], rest: Rest, tail: [...RawTail]): TupleSchema<[Head, [Rest[1]], Tail]>
export function tuple<Rest extends RestItem>(rest: Rest): TupleSchema<[[], [Rest[1]], []]>
export function tuple<
	Rest extends RestItem,
	RawTail extends RawItem[],
	Tail extends Item[] = As<Item[], ResolveRawItems<RawTail>>,
>(rest: Rest, tail: [...RawTail]): TupleSchema<[[], [Rest[1]], Tail]>
export function tuple(...args: RawTupleSchemaMaterial) {
	const resolvedMaterial = resolveMaterial(args)
	return new TupleSchema(resolvedMaterial)
}

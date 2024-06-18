import type { NullSchema, SymbolSchema, UndefinedSchema } from '../schemas'
import { null_, symbol, undefined_ } from '../schemas'
import { type BigintSchema, bigint } from '../schemas/bigint'
import { type BooleanSchema, boolean } from '../schemas/boolean'
import { type NumberSchema, number } from '../schemas/number'
import { type StringSchema, string } from '../schemas/string'
import type { AnyValSchema, AnyValSchemaThatOutputs } from './schema'

export type As<T, Input> = Input extends T ? Input : never

export type IsEqual<T, U> = (<G>() => G extends T ? 1 : 2) extends (<G>() => G extends U ? 1 : 2) ? true : false

export type IsInclude<List extends any[], Item> = List extends [infer ListItem, ...infer Rest extends any[]]
	? IsEqual<ListItem, Item> extends true ? true : IsInclude<Rest, Item>
	: false

export type IsExclude<List extends any[], Item> = IsInclude<List, Item> extends true ? false : true

export type IsEmptyList<T extends any[]> = (T extends { length: 0 } ? true : false) extends true ? true : false

export type IsNotEmptyList<T extends any[]> = T extends { length: 0 } ? false : true

export type IndexOf<T extends any[]> = { [K in keyof T]: K extends `${infer N extends number}` ? N : never }[number]

export type PickByIndex<
	Items extends any[],
	TargetIndex extends number,
	Result extends any[] = [],
	Progress extends any[] = [],
	CurrentIndex extends number = Progress['length'],
> = Items extends [infer Item, ...infer Rest extends any[]]
	? CurrentIndex extends TargetIndex
		? PickByIndex<Rest, TargetIndex, [...Result, Item], [...Progress, 0]>
		: PickByIndex<Rest, TargetIndex, Result, [...Progress, 0]>
	: Result

export type Primitive = string | number | boolean | bigint | symbol | undefined | null

export type PrimitiveSchema = StringSchema | NumberSchema | BooleanSchema | BigintSchema | SymbolSchema | UndefinedSchema | NullSchema

export type PrimitiveValueToSchema<V extends Primitive> =
	/* eslint-disable style/indent */
	| V extends string ? StringSchema<V>
	: V extends number ? NumberSchema<V>
	: V extends boolean ? BooleanSchema<V>
	: V extends bigint ? BigintSchema<V>
	: V extends symbol ? SymbolSchema<V>
	: V extends undefined ? UndefinedSchema
	: V extends null ? NullSchema
	: never
	/* eslint-enable style/indent */

export function toPrimitiveSchema<V extends Primitive>(value: V): V extends any ? PrimitiveValueToSchema<V> : never {
	switch (true) {
		case typeof value === 'string':
			return string(value) as any

		case typeof value === 'number':
			return number(value) as any

		case typeof value === 'bigint':
			return bigint(value) as any

		case typeof value === 'boolean':
			return boolean(value) as any

		case typeof value === 'symbol':
			return symbol(value) as any

		case typeof value === 'undefined':
			return undefined_() as any

		case value === null:
			return null_() as any

		default:
			throw new Error('Invalid primitive value.')
	}
}

export function isPrimitive(value: any): value is Primitive {
	return (
		typeof value === 'string'
		|| typeof value === 'number'
		|| typeof value === 'bigint'
		|| typeof value === 'boolean'
		|| typeof value === 'symbol'
		|| typeof value === 'undefined'
		|| value === null
	)
}

export type ConvertPrimitives<Material extends (Primitive | AnyValSchema)[], Result extends AnyValSchema[] = []> = Material extends [infer Item extends Primitive | AnyValSchema, ...infer Rest extends (Primitive | AnyValSchema)[]]
	? ConvertPrimitives<Rest, [...Result, Item extends Primitive ? PrimitiveValueToSchema<Item> : Item]>
	: Result

export function convertPrimitives<Items extends (Primitive | AnyValSchema)[]>(items: [...Items]) {
	return items.map(item => isPrimitive(item) ? toPrimitiveSchema(item) : item) as ConvertPrimitives<Items>
}

export type OptionalItem<T> = ['?', T]

export function isOptionalItem<T>(item: any): item is OptionalItem<T> {
	return Array.isArray(item) && item.length === 2 && item[0] === '?'
}

export type RestItem = ['...', AnyValSchemaThatOutputs<any[]>]

export function isRestItem(item: any): item is RestItem {
	return Array.isArray(item) && item.length === 2 && item[0] === '...'
}

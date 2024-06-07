import { describe, expect, it } from 'vitest'
import { BigintSchema, BooleanSchema, NullSchema, NumberSchema, StringSchema, SymbolSchema, UndefinedSchema } from '../schemas'
import { convertPrimitives, isPrimitive, toPrimitiveSchema } from './utils'

describe('test "isPrimitive" function', () => {
	it('should return true for primitive values', () => {
		expect(isPrimitive('')).toBe(true)
		expect(isPrimitive(0)).toBe(true)
		expect(isPrimitive(0n)).toBe(true)
		expect(isPrimitive(true)).toBe(true)
		expect(isPrimitive(Symbol('test'))).toBe(true)
		expect(isPrimitive(undefined)).toBe(true)
		expect(isPrimitive(null)).toBe(true)
	})

	it('should return false for non-primitive values', () => {
		expect(isPrimitive({})).toBe(false)
		expect(isPrimitive([])).toBe(false)
		expect(isPrimitive(() => {})).toBe(false)
	})
})

describe('test "toPrimitiveSchema" function', () => {
	it('should convert primitive values to their respective schemas', () => {
		const string = ''
		const stringSchema = toPrimitiveSchema(string)
		expect(stringSchema).instanceOf(StringSchema)
		expect(stringSchema._material).toBe(string)

		const number = 0
		const numberSchema = toPrimitiveSchema(number)
		expect(numberSchema).instanceOf(NumberSchema)
		expect(numberSchema._material).toBe(number)

		const bigint = 0n
		const bigintSchema = toPrimitiveSchema(bigint)
		expect(bigintSchema).instanceOf(BigintSchema)
		expect(bigintSchema._material).toBe(bigint)

		const boolean = true
		const booleanSchema = toPrimitiveSchema(boolean)
		expect(booleanSchema).instanceOf(BooleanSchema)
		expect(booleanSchema._material).toBe(boolean)

		const symbol = Symbol('test')
		const symbolSchema = toPrimitiveSchema(symbol)
		expect(symbolSchema).instanceOf(SymbolSchema)
		expect(symbolSchema._material).toBe(symbol)

		expect(toPrimitiveSchema(undefined)).instanceOf(UndefinedSchema)
		expect(toPrimitiveSchema(null)).instanceOf(NullSchema)
	})
})

describe('test "convertPrimitives" function', () => {
	it('should convert all primitive values in an array to their respective schemas', () => {
		const input = ['', 0, 0n, true, Symbol('test'), undefined, null]
		const output = convertPrimitives(input)
		expect(output).toEqual([
			toPrimitiveSchema(input[0]),
			toPrimitiveSchema(input[1]),
			toPrimitiveSchema(input[2]),
			toPrimitiveSchema(input[3]),
			toPrimitiveSchema(input[4]),
			toPrimitiveSchema(input[5]),
			toPrimitiveSchema(input[6]),
		])
	})
})

// TODO: Add types' tests

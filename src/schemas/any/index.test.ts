import { describe, expect, expectTypeOf, it } from 'vitest'
import { AnySchema, any, isAnySchema } from '.'

describe('test "AnySchema"', () => {
	it('should pass any input value and return it as any', () => {
		const schema = new AnySchema()
		const input = 'test'
		const result = schema.parse(input)
		expect(result).toBe(input)
		expectTypeOf(result).toEqualTypeOf<any>()
	})
})

describe('test "isAnySchema" function', () => {
	it('should return true if the schema is an instance of AnySchema', () => {
		const schema = new AnySchema()
		expect(isAnySchema(schema)).toBe(true)
	})

	it('should return false if the schema is not an instance of AnySchema', () => {
		const schema = {}
		expect(isAnySchema(schema)).toBe(false)
	})
})

describe('test "any" function', () => {
	it('should return a new instance of AnySchema', () => {
		const schema = any()
		expect(schema).toBeInstanceOf(AnySchema)
	})
})

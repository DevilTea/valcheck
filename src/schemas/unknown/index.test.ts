import { describe, expect, expectTypeOf, it } from 'vitest'
import { UnknownSchema, isUnknownSchema, unknown } from '.'

describe('test "UnknownSchema"', () => {
	it('should pass any input value and return it as unknown', () => {
		const schema = new UnknownSchema()
		const input = 'test'
		const result = schema.parse(input)
		expect(result).toBe(input)
		expectTypeOf(result).toEqualTypeOf<unknown>()
	})
})

describe('test "isUnknownSchema" function', () => {
	it('should return true if the schema is an instance of UnknownSchema', () => {
		const schema = new UnknownSchema()
		expect(isUnknownSchema(schema)).toBe(true)
	})
	it('should return false if the schema is not an instance of UnknownSchema', () => {
		const schema = {}
		expect(isUnknownSchema(schema)).toBe(false)
	})
})

describe('test "unknown" function', () => {
	it('should return a new instance of UnknownSchema', () => {
		const schema = unknown()
		expect(schema).toBeInstanceOf(UnknownSchema)
	})
})

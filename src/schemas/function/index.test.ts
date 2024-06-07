import { describe, expect, expectTypeOf, it } from 'vitest'
import { FunctionSchema, function_, isFunctionSchema } from '.'

describe('test "FunctionSchema"', () => {
	it('should pass for function input and return it as specific type', () => {
		const schema = new FunctionSchema<typeof input>()
		const input = (a: string): number => +a
		expect(() => schema.parse(input)).not.toThrow()
		expectTypeOf(schema.parse(input)).toEqualTypeOf<(a: string) => number>()
	})

	it('should fail for non-function input', () => {
		const schema = new FunctionSchema()
		const input = 'test'
		expect(() => schema.parse(input)).toThrow()
	})
})

describe('test "isFunctionSchema" function', () => {
	it('should return true if the schema is an instance of FunctionSchema', () => {
		const schema = new FunctionSchema()
		expect(isFunctionSchema(schema)).toBe(true)
	})

	it('should return false if the schema is not an instance of FunctionSchema', () => {
		const schema = {}
		expect(isFunctionSchema(schema)).toBe(false)
	})
})

describe('test "function_" function', () => {
	it('should return a new instance of FunctionSchema', () => {
		const schema = function_()
		expect(schema).toBeInstanceOf(FunctionSchema)
	})
})

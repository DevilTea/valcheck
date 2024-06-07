import { describe, expect, it } from 'vitest'
import { NeverSchema, isNeverSchema, never } from '.'

describe('test "NeverSchema"', () => {
	it('should fail for any input value', () => {
		const schema = new NeverSchema()
		const input = 'test'
		expect(() => schema.parse(input)).toThrow()
	})
})

describe('test "isNeverSchema" function', () => {
	it('should return true if the schema is an instance of NeverSchema', () => {
		const schema = new NeverSchema()
		expect(isNeverSchema(schema)).toBe(true)
	})

	it('should return false if the schema is not an instance of NeverSchema', () => {
		const schema = {}
		expect(isNeverSchema(schema)).toBe(false)
	})
})

describe('test "never" function', () => {
	it('should return a new instance of NeverSchema', () => {
		const schema = never()
		expect(schema).toBeInstanceOf(NeverSchema)
	})
})

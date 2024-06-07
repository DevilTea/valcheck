import { describe, expect, it } from 'vitest'
import { BooleanSchema, boolean, isBooleanSchema } from '.'

describe('test "BooleanSchema" class', () => {
	it('should return true for isUnspecific when material is null', () => {
		const schema = new BooleanSchema(null)
		expect(schema.isUnspecific()).toBe(true)
	})
	it('should return true for isSpecific when material is a boolean', () => {
		const schema = new BooleanSchema(true)
		expect(schema.isSpecific()).toBe(true)
	})
})

describe('test "isBooleanSchema" function', () => {
	it('should return true if the schema is an instance of BooleanSchema', () => {
		const schema = new BooleanSchema(null)
		expect(isBooleanSchema(schema)).toBe(true)
	})
	it('should return false if the schema is not an instance of BooleanSchema', () => {
		const schema = {}
		expect(isBooleanSchema(schema)).toBe(false)
	})
})

describe('test "boolean" function', () => {
	it('should return a new instance of BooleanSchema when called without arguments', () => {
		const schema = boolean()
		expect(schema).toBeInstanceOf(BooleanSchema)
		expect(schema.isUnspecific()).toBe(true)
	})
	it('should return a new instance of BooleanSchema with the provided material when called with a boolean argument', () => {
		const schema = boolean(true)
		expect(schema).toBeInstanceOf(BooleanSchema)
		expect(schema.isSpecific()).toBe(true)
	})
})

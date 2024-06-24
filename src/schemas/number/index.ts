import { BaseValSchemaWithMaterial, implementExecuteFn } from '../../core/schema'

type NumberSchemaMaterial = null | number

type NumberSchemaOutput<Material extends NumberSchemaMaterial> = Material extends null ? number : Material

export class NumberSchema<Material extends NumberSchemaMaterial = NumberSchemaMaterial> extends BaseValSchemaWithMaterial({
	Name: 'number',
})<{
	Issues: {
		NUMBER_EXPECTED: { input: any }
		NUMBER_MISMATCH: { input: any, expected: number }
	}
	Material: Material
	Input: any
	Output: NumberSchemaOutput<Material>
}> {
	isUnspecific(): this is NumberSchema<null> {
		return this._material == null
	}

	isSpecific(): this is NumberSchema<number> {
		return this._material != null
	}
}

implementExecuteFn(
	NumberSchema,
	({ schema, input, reason, fail, pass }) => {
		if (schema.isUnspecific() && typeof input !== 'number')
			return fail([reason('NUMBER_EXPECTED', { input })])

		if (
			schema.isSpecific() && (input !== schema._material && (Number.isNaN(input) && Number.isNaN(schema._material) === false))
		)
			return fail([reason('NUMBER_MISMATCH', { input, expected: schema._material })])

		return pass(input)
	},
)

export function isNumberSchema(schema: any): schema is NumberSchema {
	return schema instanceof NumberSchema
}

export function number(): NumberSchema<null>
export function number<Material extends number>(material: Material): NumberSchema<Material>
export function number(material?: number) {
	if (material == null)
		return new NumberSchema(null)

	return new NumberSchema(material)
}

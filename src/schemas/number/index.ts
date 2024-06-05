import { BaseValSchema, implementExecuteFn } from '../../core/schema'

type NumberSchemaMaterial = null | number

type NumberSchemaOutput<Material extends NumberSchemaMaterial> = Material extends null ? number : Material

export class NumberSchema<Material extends NumberSchemaMaterial = NumberSchemaMaterial> extends BaseValSchema({
	Name: 'number',
	Issues: ['UNEXPECTED_INPUT'],
})<{
	Material: Material
	Input: any
	Output: NumberSchemaOutput<Material>
}> {
	constructor(material: Material) {
		super(material)
	}

	isUnspecific(): this is NumberSchema<null> {
		return this._material == null
	}

	isSpecific(): this is NumberSchema<number> {
		return this._material != null
	}
}

implementExecuteFn(
	NumberSchema,
	({ schema, input, fail, pass }) => {
		if (schema.isUnspecific() && typeof input === 'number')
			return pass(input)

		if (
			schema.isSpecific() && (
				input === schema._material
				|| (Number.isNaN(input) && Number.isNaN(schema._material))
			)
		)
			return pass(input)

		return fail('UNEXPECTED_INPUT', input)
	},
)

export function number<Material extends NumberSchemaMaterial = null>(literal = null as Material) {
	return new NumberSchema(literal)
}

export function isNumberSchema(schema: any): schema is NumberSchema {
	return schema instanceof NumberSchema
}

number(Number.NaN)

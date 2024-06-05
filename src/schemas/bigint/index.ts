import { BaseValSchema, implementExecuteFn } from '../../core/schema'

type BigintSchemaMaterial = null | bigint

type BigintSchemaOutput<Material extends BigintSchemaMaterial> = Material extends null ? bigint : Material

export class BigintSchema<Material extends BigintSchemaMaterial = BigintSchemaMaterial> extends BaseValSchema({
	Name: 'bigint',
	Issues: ['UNEXPECTED_INPUT'],
})<{
	Material: Material
	SchemaPath: []
	Input: any
	Output: BigintSchemaOutput<Material>
}> {
	constructor(material: Material) {
		super(material)
	}

	isUnspecific(): this is BigintSchema<null> {
		return this._material == null
	}

	isSpecific(): this is BigintSchema<bigint> {
		return this._material != null
	}
}

implementExecuteFn(
	BigintSchema,
	({ schema, input, fail, pass }) => {
		if (schema.isUnspecific() && typeof input === 'bigint')
			return pass(input)

		if (schema.isSpecific() && input === schema._material)
			return pass(input)

		return fail('UNEXPECTED_INPUT', input)
	},
)

export function bigint<Material extends BigintSchemaMaterial = null>(literal = null as Material) {
	return new BigintSchema(literal)
}

export function isBigintSchema(schema: any): schema is BigintSchema {
	return schema instanceof BigintSchema
}

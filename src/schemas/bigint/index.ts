import { BaseValSchemaWithMaterial, implementExecuteFn } from '../../core/schema'

type BigintSchemaMaterial = null | bigint

type BigintSchemaOutput<Material extends BigintSchemaMaterial> = Material extends null ? bigint : Material

export class BigintSchema<Material extends BigintSchemaMaterial = BigintSchemaMaterial> extends BaseValSchemaWithMaterial({
	Name: 'bigint',
	Issues: ['UNEXPECTED_INPUT'],
})<{
	Material: Material
	Input: any
	Output: BigintSchemaOutput<Material>
}> {
	isUnspecific(): this is BigintSchema<null> {
		return this._material == null
	}

	isSpecific(): this is BigintSchema<bigint> {
		return this._material != null
	}
}

implementExecuteFn(
	BigintSchema,
	({ schema, input, reason, fail, pass }) => {
		if (schema.isUnspecific() && typeof input === 'bigint')
			return pass(input)

		if (schema.isSpecific() && input === schema._material)
			return pass(input)

		return fail([reason('UNEXPECTED_INPUT', input)])
	},
)

export function isBigintSchema(schema: any): schema is BigintSchema {
	return schema instanceof BigintSchema
}

export function bigint(): BigintSchema<null>
export function bigint<Material extends bigint>(material: Material): BigintSchema<Material>
export function bigint(material?: bigint) {
	if (material == null)
		return new BigintSchema(null)

	return new BigintSchema(material)
}

import { BaseValSchemaWithMaterial, implementExecuteFn } from '../../core/schema'

type BigintSchemaMaterial = null | bigint

type BigintSchemaOutput<Material extends BigintSchemaMaterial> = Material extends null ? bigint : Material

export class BigintSchema<Material extends BigintSchemaMaterial = BigintSchemaMaterial> extends BaseValSchemaWithMaterial({
	Name: 'bigint',
	Issues: ['BIGINT_EXPECTED', 'BIGINT_MISMATCH'],
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
		if (schema.isUnspecific() && typeof input !== 'bigint')
			return fail([reason('BIGINT_EXPECTED', { input })])

		if (schema.isSpecific() && input !== schema._material)
			return fail([reason('BIGINT_MISMATCH', { input, expected: schema._material })])

		return pass(input)
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

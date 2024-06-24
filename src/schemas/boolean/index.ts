import { BaseValSchemaWithMaterial, implementExecuteFn } from '../../core/schema'

type BooleanSchemaMaterial = null | boolean

type BooleanSchemaOutput<Material extends BooleanSchemaMaterial> = Material extends null ? boolean : Material

export class BooleanSchema<Material extends BooleanSchemaMaterial = BooleanSchemaMaterial> extends BaseValSchemaWithMaterial({
	Name: 'boolean',
})<{
	Issues: {
		BOOLEAN_EXPECTED: { input: any }
		BOOLEAN_MISMATCH: { input: any, expected: boolean }
	}
	Material: Material
	Input: any
	Output: BooleanSchemaOutput<Material>
}> {
	isUnspecific(): this is BooleanSchema<null> {
		return this._material == null
	}

	isSpecific(): this is BooleanSchema<boolean> {
		return this._material != null
	}
}

implementExecuteFn(
	BooleanSchema,
	({ schema, input, reason, fail, pass }) => {
		if (schema.isUnspecific() && typeof input !== 'boolean')
			return fail([reason('BOOLEAN_EXPECTED', { input })])

		if (schema.isSpecific() && input !== schema._material)
			return fail([reason('BOOLEAN_MISMATCH', { input, expected: schema._material })])

		return pass(input)
	},
)

export function isBooleanSchema(schema: any): schema is BooleanSchema {
	return schema instanceof BooleanSchema
}

export function boolean(): BooleanSchema<null>
export function boolean<Material extends boolean>(material: Material): BooleanSchema<Material>
export function boolean(material?: boolean) {
	if (material == null)
		return new BooleanSchema(null)

	return new BooleanSchema(material)
}

import { BaseValSchemaWithMaterial, implementExecuteFn } from '../../core/schema'

type BooleanSchemaMaterial = null | boolean

type BooleanSchemaOutput<Material extends BooleanSchemaMaterial> = Material extends null ? boolean : Material

export class BooleanSchema<Material extends BooleanSchemaMaterial = BooleanSchemaMaterial> extends BaseValSchemaWithMaterial({
	Name: 'boolean',
	Issues: ['UNEXPECTED_INPUT'],
})<{
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
	({ schema, input, fail, pass }) => {
		if (schema.isUnspecific() && typeof input === 'boolean')
			return pass(input)

		if (schema.isSpecific() && input === schema._material)
			return pass(input)

		return fail('UNEXPECTED_INPUT', input)
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

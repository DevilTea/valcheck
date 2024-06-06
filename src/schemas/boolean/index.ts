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

export function boolean<Material extends BooleanSchemaMaterial = null>(literal = null as Material) {
	return new BooleanSchema(literal)
}

export function isBooleanSchema(schema: any): schema is BooleanSchema {
	return schema instanceof BooleanSchema
}

import { BaseValSchemaWithMaterial, implementExecuteFn } from '../../core/schema'

type SymbolSchemaMaterial = null | symbol

type SymbolSchemaOutput<Material extends SymbolSchemaMaterial> = Material extends null ? symbol : Material

export class SymbolSchema<Material extends SymbolSchemaMaterial = SymbolSchemaMaterial> extends BaseValSchemaWithMaterial({
	Name: 'symbol',
	Issues: ['UNEXPECTED_INPUT'],
})<{
	Material: Material
	Input: any
	Output: SymbolSchemaOutput<Material>
}> {
	isUnspecific(): this is SymbolSchema<null> {
		return this._material == null
	}

	isSpecific(): this is SymbolSchema<symbol> {
		return this._material != null
	}
}

implementExecuteFn(
	SymbolSchema,
	({ schema, input, fail, pass }) => {
		if (schema.isUnspecific() && typeof input === 'symbol')
			return pass(input)

		if (schema.isSpecific() && input === schema._material)
			return pass(input)

		return fail('UNEXPECTED_INPUT', input)
	},
)

export function symbol<Material extends SymbolSchemaMaterial = null>(unique = null as Material) {
	return new SymbolSchema(unique)
}

export function isSymbolSchema(schema: any): schema is SymbolSchema {
	return schema instanceof SymbolSchema
}

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
	({ schema, input, reason, fail, pass }) => {
		if (schema.isUnspecific() && typeof input === 'symbol')
			return pass(input)

		if (schema.isSpecific() && input === schema._material)
			return pass(input)

		return fail([reason('UNEXPECTED_INPUT', input)])
	},
)

export function isSymbolSchema(schema: any): schema is SymbolSchema {
	return schema instanceof SymbolSchema
}

export function symbol(): SymbolSchema<null>
export function symbol<Material extends symbol>(material: Material): SymbolSchema<Material>
export function symbol(material?: symbol) {
	if (material == null)
		return new SymbolSchema(null)

	return new SymbolSchema(material)
}

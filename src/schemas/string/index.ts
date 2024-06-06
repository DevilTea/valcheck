import { BaseValSchemaWithMaterial, implementExecuteFn } from '../../core/schema'
import { type CreateTemplateLiteralSchema, type RawTemplateLiteralMaterial, type TemplateLiteralMaterial, type TemplatePartialsToOutput, createTemplateLiteral } from './templateLiteral'

export type { TemplateLiteralMaterial } from './templateLiteral'

type StringSchemaMaterial = null | string | TemplateLiteralMaterial
type StringSchemaOutput<Material extends StringSchemaMaterial> = Material extends null
	? string
	: Material extends string
		? Material
		: Material extends TemplateLiteralMaterial
			? TemplatePartialsToOutput<Material['partials']>
			: never

export class StringSchema<Material extends StringSchemaMaterial = StringSchemaMaterial> extends BaseValSchemaWithMaterial({
	Name: 'string',
	Issues: ['UNEXPECTED_INPUT'],
})<{
	Material: Material
	Input: any
	Output: StringSchemaOutput<Material>
}> {
	isUnspecific(): this is StringSchema<null> {
		return this._material == null
	}

	isSpecific(): this is StringSchema<string> {
		return typeof this._material === 'string'
	}

	isTemplateLiteral(): this is StringSchema<TemplateLiteralMaterial> {
		return Array.isArray(this._material)
	}
}

implementExecuteFn(
	StringSchema,
	({ schema, input, fail, pass }) => {
		if (schema.isUnspecific() && typeof input === 'string')
			return pass(input)

		if (schema.isSpecific() && input === schema._material)
			return pass(input)

		if (schema.isTemplateLiteral() && schema._material.regexp.test(input))
			return pass(input)

		return fail('UNEXPECTED_INPUT', input)
	},
)

export function string(): StringSchema<null>
export function string<Material extends string>(material: Material): StringSchema<Material>
export function string<RawMaterial extends RawTemplateLiteralMaterial>(...material: [...RawMaterial]): CreateTemplateLiteralSchema<RawMaterial>
export function string(...args: [] | [null] | [string] | RawTemplateLiteralMaterial) {
	if (args.length === 0)
		return new StringSchema(null)

	if (args.length === 1 && (args[0] === null || typeof args[0] === 'string'))
		return new StringSchema(args[0])

	return createTemplateLiteral(args as RawTemplateLiteralMaterial)
}

export function isStringSchema(schema: any): schema is StringSchema {
	return schema instanceof StringSchema
}

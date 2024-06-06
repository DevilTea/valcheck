import { BaseValSchemaWithMaterial, implementExecuteFn } from '../../core/schema'

type InstanceSchemaMaterial = abstract new (...args: any) => any

type InstanceSchemaOutput<Material extends InstanceSchemaMaterial> = InstanceType<Material>

export class InstanceSchema<Material extends InstanceSchemaMaterial = InstanceSchemaMaterial> extends BaseValSchemaWithMaterial({
	Name: 'instance',
	Issues: ['UNEXPECTED_INPUT'],
})<{
	Material: Material
	Input: any
	Output: InstanceSchemaOutput<Material>
}> {}

implementExecuteFn(
	InstanceSchema,
	({ schema, input, fail, pass }) => {
		if ((input instanceof schema._material))
			return pass(input)

		return fail('UNEXPECTED_INPUT', input)
	},

)

export function instance<Material extends InstanceSchemaMaterial>(material: Material) {
	return new InstanceSchema(material)
}

export function isInstanceSchema(schema: any): schema is InstanceSchema {
	return schema instanceof InstanceSchema
}

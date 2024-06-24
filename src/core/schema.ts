interface BaseValidationResult {
	type: 'passed' | 'failed'
}

export interface ValidationResultPassed<Output> extends BaseValidationResult {
	type: 'passed'
	value: Output
}

export interface ValidationResultFailed extends BaseValidationResult {
	type: 'failed'
	reasons: ValidationFailedReason<any>[]
}

export type ValidationPath = (string | number | symbol)[]
export type ValSchemaPath = (string | number | symbol)[]

export interface ValidationFailedReason<Issue extends string> {
	schema: AnyValSchema
	issue: Issue
	path: ValidationPath
	payload: any
	reasons?: ValidationFailedReason<any>[] | undefined
}

export type ValidationResult<Output> = ValidationResultPassed<Output> | ValidationResultFailed

export class ValidationError extends Error {
	reasons: ValidationFailedReason<any>[]
	constructor(reasons: ValidationFailedReason<any>[]) {
		super('Validation Error')
		this.reasons = reasons
	}
}

function pass(value: any): ValidationResultPassed<any> {
	return { type: 'passed', value }
}

function reason({
	context,
	schema,
	issue,
	payload,
	reasons,
}: {
	context: ValidationContext
	schema: AnyValSchema
	issue: string
	payload: any
	reasons?: ValidationFailedReason<any>[] | undefined
}): ValidationFailedReason<any> {
	return {
		schema,
		issue,
		path: [...context.currentPath],
		payload,
		reasons,
	}
}

function fail(reasons: ValidationFailedReason<any>[]): ValidationResultFailed {
	return { type: 'failed', reasons }
}

function shouldNeverBeCalled<T>(): T {
	throw new Error('This function should never be called.')
}

export class ValidationContext {
	currentPath: ValidationPath
	reasons: ValidationFailedReason<any>[]

	constructor() {
		this.currentPath = []
		this.reasons = []
	}
}

function createExecutionContext() {
	return new ValidationContext()
}

export type ProvidedValidateFnPayload<Schema extends AnyValSchema> = Omit<
	{
		schema: Schema
		input: InputOf<Schema>
		context: ValidationContext
		pass: (input: InputOf<Schema>) => ValidationResultPassed<OutputOf<Schema>>
		reason: <Issues extends IssuesOf<Schema>, I extends keyof Issues>(issue: I, payload: Issues[I], reasons?: ValidationFailedReason<any>[]) => ValidationFailedReason<(keyof Issues) & string>
		fail: (reasons: ValidationFailedReason<IssuesOf<Schema>[number]>[]) => ValidationResultFailed
	},
	[IssuesOf<Schema>] extends [never]
		? 'reason' | 'fail'
		: never
>

type ValidateFnImpl<Schema extends AnyValSchema> = (payload: ProvidedValidateFnPayload<Schema>) => ValidationResult<OutputOf<Schema>>

abstract class _BaseValSchema<
	Params extends {
		Name: string
		Issues: Record<string, any>
		Material: any
		Input: any
		Output: any
	},
	Name extends string = Params['Name'],
	Issues extends Record<string, any> = Params['Issues'],
	Material = Params['Material'],
	Input = Params['Input'],
	Output = Params['Output'],
> {
	abstract _name: Name
	_material: Material

	/**
	 * Only used for type inference
	 */
	_types = shouldNeverBeCalled<{
		_issues: Issues
		_input: Input
		_output: Output
	}>

	constructor(material: Material) {
		this._material = material
	}

	_validate(_payload: ProvidedValidateFnPayload<any>): ValidationResult<OutputOf<any>> {
		throw new Error('Not implemented')
	}

	execute(input: Input, context: ValidationContext = createExecutionContext()): ValidationResult<Output> {
		const payload = {
			schema: this,
			input,
			context,
			material: this._material,
			pass,
			reason: (issue: any, payload: any, reasons?: ValidationFailedReason<any>[] | undefined) =>
				reason({ context, schema: this, issue, payload, reasons }),
			fail,
		}
		return this._validate(payload)
	}

	parse(input: Input): Output {
		const context = createExecutionContext()
		const result = this.execute(input, context)

		if (result.type === 'failed')
			throw new ValidationError(result.reasons)

		return result.value
	}
}

export function BaseValSchema<Name extends string>({ Name: name }: { Name: Name }) {
	abstract class BaseValSchema<
		Params extends {
			Issues?: Record<string, any>
			Input: any
			Output: any
		},
		Issues extends Record<string, any> = Params['Issues'] extends Record<string, any> ? Params['Issues'] : never,
		Input = Params['Input'],
		Output = Params['Output'],
	> extends _BaseValSchema<{
		Name: Name
		Issues: Issues
		Material: null
		Input: Input
		Output: Output
	}> {
		_name = name

		constructor() {
			super(null)
		}
	}

	return BaseValSchema
}

export function BaseValSchemaWithMaterial<Name extends string>({ Name: name }: { Name: Name }) {
	abstract class BaseValSchema<
		Params extends {
			Issues?: Record<string, any>
			Material: any
			Input: any
			Output: any
		},
		Issues extends Record<string, any> = Params['Issues'] extends Record<string, any> ? Params['Issues'] : never,
		Material = Params['Material'],
		Input = Params['Input'],
		Output = Params['Output'],
	> extends _BaseValSchema<{
		Name: Name
		Issues: Issues
		Material: Material
		Input: Input
		Output: Output
	}> {
		_name = name
	}

	return BaseValSchema
}

type AnyValSchemaClassThatOutputs<Output> = typeof _BaseValSchema<{ Name: any, Issues: any, Material: any, Input: any, Output: Output }>

type AnyValSchemaClass = AnyValSchemaClassThatOutputs<any>

export type AnyValSchemaThatOutputs<Output> = _BaseValSchema<{ Name: any, Issues: any, Material: any, Input: any, Output: Output }>

export type AnyValSchema = AnyValSchemaThatOutputs<any>

export function implementValidateFn<
	SchemaClass extends AnyValSchemaClass,
	Schema extends InstanceType<SchemaClass>,
	ExecuteFn extends ValidateFnImpl<Schema>,
>(schemaClass: SchemaClass, executeFn: ExecuteFn) {
	schemaClass.prototype._validate = executeFn
}

export type IssuesOf<Schema> = Schema extends AnyValSchema
	? ReturnType<Schema['_types']>['_issues']
	: 'Not A ValSchema'

export type MaterialOf<Schema> = Schema extends AnyValSchema
	? Schema['_material']
	: 'Not A ValSchema'

export type InputOf<Schema> = Schema extends AnyValSchema
	? ReturnType<Schema['_types']>['_input']
	: 'Not A ValSchema'

export type OutputOf<Schema> = Schema extends AnyValSchema
	? ReturnType<Schema['_types']>['_output']
	: 'Not A ValSchema'

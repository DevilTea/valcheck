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

export type ExecutionPath = (string | number | symbol)[]
export type ValSchemaPath = (string | number | symbol)[]

export interface ValidationFailedReason<Issue extends string> {
	schema: AnyValSchema
	issue: Issue
	path: ExecutionPath
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
	context: ExecutionContext
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

export class ExecutionContext {
	currentPath: ExecutionPath
	reasons: ValidationFailedReason<any>[]

	constructor() {
		this.currentPath = []
		this.reasons = []
	}
}

function createExecutionContext() {
	return new ExecutionContext()
}

export type ProvidedExecuteFnPayload<Schema extends AnyValSchema> = Omit<
	{
		schema: Schema
		input: InputOf<Schema>
		context: ExecutionContext
		pass: (input: InputOf<Schema>) => ValidationResultPassed<OutputOf<Schema>>
		reason: (issue: IssuesOf<Schema>[number], payload: any, reasons?: ValidationFailedReason<any>[]) => ValidationFailedReason<IssuesOf<Schema>[number]>
		fail: (reasons: ValidationFailedReason<IssuesOf<Schema>[number]>[]) => ValidationResultFailed
	},
	IssuesOf<Schema> extends []
		? 'reason' | 'fail'
		: never
>

type ExecuteFnImpl<Schema extends AnyValSchema> = (payload: ProvidedExecuteFnPayload<Schema>) => ValidationResult<OutputOf<Schema>>

abstract class _BaseValSchema<
	Params extends {
		Name: string
		Issues: string[]
		Material: any
		Input: any
		Output: any
	},
	Name extends string = Params['Name'],
	Issues extends string[] = Params['Issues'],
	Material = Params['Material'],
	Input = Params['Input'],
	Output = Params['Output'],
> {
	abstract _name: Name
	abstract _issues: Issues | []
	_material: Material

	/**
	 * Only used for type inference
	 */
	_types = shouldNeverBeCalled<{
		_input: Input
		_output: Output
	}>

	constructor(material: Material) {
		this._material = material
	}

	_execute(_payload: ProvidedExecuteFnPayload<any>): ValidationResult<OutputOf<any>> {
		throw new Error('Not implemented')
	}

	execute(input: Input, context: ExecutionContext = createExecutionContext()): ValidationResult<Output> {
		const payload = {
			schema: this,
			input,
			context,
			material: this._material,
			pass,
			reason: (issue: string, value: any, reasons?: ValidationFailedReason<any>[] | undefined) =>
				reason({ context, schema: this, issue, payload: value, reasons }),
			fail,
		}
		return this._execute(payload)
	}

	parse(input: Input): Output {
		const context = createExecutionContext()
		const result = this.execute(input, context)

		if (result.type === 'failed')
			throw new ValidationError(result.reasons)

		return result.value
	}
}

export function BaseValSchema<Name extends string, Issues extends string[] = []>({ Name: name, Issues: issues }: { Name: Name, Issues?: [...Issues] }) {
	abstract class BaseValSchema<
		Params extends {
			Input: any
			Output: any
		},
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
		_issues = issues || []

		constructor() {
			super(null)
		}
	}

	return BaseValSchema
}

export function BaseValSchemaWithMaterial<Name extends string, Issues extends string[]>({ Name: name, Issues: issues }: { Name: Name, Issues?: [...Issues] }) {
	abstract class BaseValSchema<
		Params extends {
			Material: any
			Input: any
			Output: any
		},
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
		_issues = issues || []
	}

	return BaseValSchema
}

type AnyValSchemaClassThatOutputs<Output> = typeof _BaseValSchema<{ Name: any, Issues: any, Material: any, Input: any, Output: Output }>

type AnyValSchemaClass = AnyValSchemaClassThatOutputs<any>

export type AnyValSchemaThatOutputs<Output> = _BaseValSchema<{ Name: any, Issues: any, Material: any, Input: any, Output: Output }>

export type AnyValSchema = AnyValSchemaThatOutputs<any>

export function implementExecuteFn<
	SchemaClass extends AnyValSchemaClass,
	Schema extends InstanceType<SchemaClass>,
	ExecuteFn extends ExecuteFnImpl<Schema>,
>(schemaClass: SchemaClass, executeFn: ExecuteFn) {
	schemaClass.prototype._execute = executeFn
}

export type IssuesOf<Schema> = Schema extends AnyValSchema
	? Schema['_issues']
	: 'Not A ValSchema'

export type IssueOf<Schema> = Schema extends AnyValSchema
	? Schema['_issues'][number]
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

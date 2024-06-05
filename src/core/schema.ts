interface BaseValidationResult {
	type: 'passed' | 'failed'
}

export interface ValidationResultPassed<Output> extends BaseValidationResult {
	type: 'passed'
	value: Output
}

export interface ValidationResultFailed extends BaseValidationResult {
	type: 'failed'
}

export type ExecutionPath = (string | number | symbol)[]
export type ValSchemaPath = (string | number | symbol)[]

export interface ValidationFailedReason<Issue extends string> {
	schema: AnyValSchema
	issue: Issue
	path: ExecutionPath
	value: any
}

export interface ExecutionContext {
	currentPath: ExecutionPath
	shouldCollectReason: boolean
	reasons: ValidationFailedReason<any>[]
}

export type ValidationResult<Output> = ValidationResultPassed<Output> | ValidationResultFailed

export class ValidationError extends Error {
	reasons: ValidationFailedReason<any>[]
	constructor(reasons: ValidationFailedReason<any>[]) {
		super('Validation Error')
		this.reasons = reasons
	}
}

export interface ProvidedExecuteFnPayload<Schema extends AnyValSchema> {
	schema: Schema
	input: InputOf<Schema>
	context: ExecutionContext
	pass: (input: InputOf<Schema>) => ValidationResultPassed<OutputOf<Schema>>
	fail: IssuesOf<Schema> extends []
		? () => ValidationResultFailed
		: {
				(issue: IssuesOf<Schema>[number], value: any): ValidationResultFailed
				(): ValidationResultFailed
			}
}

type ExecuteFnImpl<Schema extends AnyValSchema> = (payload: ProvidedExecuteFnPayload<Schema>) => ValidationResult<OutputOf<Schema>>

function createExecutionContext(): ExecutionContext {
	return {
		currentPath: [],
		shouldCollectReason: true,
		reasons: [],
	}
}

function pass(value: any): ValidationResultPassed<any> {
	return { type: 'passed', value }
}

function fail(): ValidationResultFailed
function fail(issue: string, value: any, schema: AnyValSchema, context: ExecutionContext): ValidationResultFailed
function fail(...args: [] | [issue: string, value: any, schema: AnyValSchema, context: ExecutionContext]): ValidationResultFailed {
	if (args.length !== 0 && args[3].shouldCollectReason) {
		const [issue, value, schema, context] = args
		const path = [...context.currentPath]
		const reason: ValidationFailedReason<string> = {
			schema,
			issue,
			path,
			value,
		}
		context.reasons.push(reason)
	}
	return { type: 'failed' }
}

function shouldNeverBeCalled<T>(): T {
	throw new Error('This function should never be called.')
}

abstract class _BaseValSchema<
	Params extends {
		Name: string
		Issues: string[]
		Material: any
		Input: any
		Output: any
		SchemaPath: (string | number | symbol)[]
	},
	Name extends string = Params['Name'],
	Issues extends string[] = Params['Issues'],
	Material = Params['Material'],
	Input = Params['Input'],
	Output = Params['Output'],
	SchemaPath extends ValSchemaPath = Params['SchemaPath'],
> {
	abstract _name: Name
	abstract _issues: Issues
	_material: Material

	/**
	 * Only used for type inference
	 */
	_types = shouldNeverBeCalled<{
		_schemaPath: SchemaPath
		_input: Input
		_output: Output
	}>

	_execute: ExecuteFnImpl<any> = shouldNeverBeCalled

	constructor(material: Material) {
		this._material = material
	}

	execute(input: Input, context?: ExecutionContext) {
		const _context = context || createExecutionContext()
		const payload = {
			schema: this,
			input: input as InputOf<typeof this>,
			context: _context,
			material: this._material as MaterialOf<typeof this>,
			pass,
			fail: (...args: [] | [issue: string, value: any]) => args.length === 0
				? fail()
				: fail(args[0], args[1], this as any, _context),
		}
		return this._execute(payload as any)
	}

	parse(input: Input) {
		const context = createExecutionContext()
		const result = this.execute(input, context)

		if (result.type === 'failed')
			throw new ValidationError(context.reasons)

		return result.value
	}
}

export function BaseValSchema<Name extends string, Issues extends string[]>({ Name: name, Issues: issues }: { Name: Name, Issues: [...Issues] }) {
	abstract class BaseValSchema<
		Params extends {
			Material: any
			Input: any
			Output: any
			SchemaPath: (string | number | symbol)[]
		},
		Material = Params['Material'],
		Input = Params['Input'],
		Output = Params['Output'],
		SchemaPath extends ValSchemaPath = Params['SchemaPath'],
	> extends _BaseValSchema<{
		Name: Name
		Issues: Issues
		Material: Material
		Input: Input
		Output: Output
		SchemaPath: SchemaPath
	}> {
		_name = name
		_issues = issues
	}

	return BaseValSchema
}

type AnyValSchemaClassThatOutputs<Output> = typeof _BaseValSchema<{ Name: any, Issues: any, SchemaPath: any, Material: any, Input: any, Output: Output }>

type AnyValSchemaClass = AnyValSchemaClassThatOutputs<any>

export type AnyValSchemaThatOutputs<Output> = _BaseValSchema<{ Name: any, Issues: any, SchemaPath: any, Material: any, Input: any, Output: Output }>

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

export type MaterialOf<Schema> = Schema extends AnyValSchema
	? Schema['_material']
	: 'Not A ValSchema'

export type SchemaPathOf<Schema> = Schema extends AnyValSchema
	? ReturnType<Schema['_types']>['_schemaPath']
	: 'Not A ValSchema'

export type InputOf<Schema> = Schema extends AnyValSchema
	? ReturnType<Schema['_types']>['_input']
	: 'Not A ValSchema'

export type OutputOf<Schema> = Schema extends AnyValSchema
	? ReturnType<Schema['_types']>['_output']
	: 'Not A ValSchema'

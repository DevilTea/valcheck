import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
	alias: {
		'@': 'src',
	},
	entries: [
		'src/index',
	],
	declaration: true,
	clean: true,
	rollup: {
		emitCJS: true,
	},
})

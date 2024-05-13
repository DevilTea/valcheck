import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		alias: {
			'@': 'src',
		},
		coverage: {
			enabled: true,
			include: ['src/**/*.ts'],
		},
		typecheck: {
			enabled: true,
		},
	},
})

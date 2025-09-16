import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
	test: {
		globals: true,
		setupFiles: ["./vitest.setup.ts"],
		watch: false,
		reporters: ["dot"],
		silent: true,
		testTimeout: 20_000,
		hookTimeout: 20_000,
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html", "lcov"],
			exclude: [
				"**/__tests__/**",
				"**/__mocks__/**",
				"**/dist/**",
				"**/node_modules/**",
				"**/*.spec.ts",
				"**/*.test.ts",
				"**/vitest.*.ts",
				"**/esbuild.mjs",
			],
			thresholds: {
				lines: 98,
				functions: 98,
				branches: 95,
				statements: 98,
			},
		},
	},
	resolve: {
		alias: {
			vscode: path.resolve(__dirname, "./__mocks__/vscode.js"),
		},
	},
})

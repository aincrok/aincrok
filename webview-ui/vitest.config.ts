import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
	test: {
		globals: true,
		setupFiles: ["./vitest.setup.ts"],
		watch: false,
		reporters: ["dot"],
		silent: true,
		environment: "jsdom",
		include: ["src/**/*.spec.ts", "src/**/*.spec.tsx"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html", "lcov"],
			exclude: [
				"**/__tests__/**",
				"**/__mocks__/**",
				"**/dist/**",
				"**/node_modules/**",
				"**/*.spec.ts",
				"**/*.spec.tsx",
				"**/*.test.ts",
				"**/*.test.tsx",
				"**/vitest.*.ts",
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
			"@": path.resolve(__dirname, "./src"),
			"@src": path.resolve(__dirname, "./src"),
			"@roo": path.resolve(__dirname, "../src/shared"),
			// Mock the vscode module for tests since it's not available outside
			// VS Code extension context.
			vscode: path.resolve(__dirname, "./src/__mocks__/vscode.ts"),
		},
	},
})

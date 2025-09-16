import * as path from "path"
import Mocha from "mocha"
import { glob } from "glob"
import * as vscode from "vscode"

import type { RooCodeAPI } from "@roo-code/types"

import { waitFor } from "./utils"
import { setupTestEnvironment, teardownTestEnvironment } from "./test-setup"

export async function run(): Promise<void> {
	console.log("Starting test suite...")
	console.log("Test directory:", __dirname)

	// Set up test environment and global API
	try {
		await setupTestEnvironment()
	} catch (error) {
		console.error("Failed to set up test environment:", error)
		throw error
	}

	// Create a Mocha instance with proper configuration
	const mochaOptions: Mocha.MochaOptions = {
		ui: "tdd", // Use TDD interface for suite/test style tests
		color: true,
		timeout: 20 * 60 * 1_000, // 20m
		reporter: process.env.CI ? "spec" : "spec",
	}

	if (process.env.TEST_GREP) {
		mochaOptions.grep = process.env.TEST_GREP
		console.log(`Running tests matching pattern: ${process.env.TEST_GREP}`)
	}

	const mocha = new Mocha(mochaOptions)

	// Use the correct directory for finding test files
	const testsRoot = path.resolve(__dirname)

	let testFiles: string[]

	try {
		if (process.env.TEST_FILE) {
			const specificFile = process.env.TEST_FILE.endsWith(".js")
				? process.env.TEST_FILE
				: `${process.env.TEST_FILE}.js`

			// Look for the specific file in the test directory
			testFiles = await glob(specificFile, {
				cwd: testsRoot,
				absolute: true,
			})

			if (testFiles.length === 0) {
				// Try with wildcard if exact match not found
				testFiles = await glob(`**/${specificFile}`, {
					cwd: testsRoot,
					absolute: true,
				})
			}

			console.log(`Running specific test file: ${specificFile}`)
		} else {
			// Find all test files in the suite directory
			testFiles = await glob("**/*.test.js", {
				cwd: testsRoot,
				absolute: true,
			})
		}

		console.log(`Found ${testFiles.length} test file(s):`)
		testFiles.forEach((file) => console.log(`  - ${path.basename(file)}`))

		if (testFiles.length === 0) {
			throw new Error(`No test files found matching criteria: ${process.env.TEST_FILE || "*.test.js"}`)
		}

		// Add files to the test suite
		testFiles.forEach((testFile) => {
			console.log(`Adding test file: ${testFile}`)
			mocha.addFile(testFile)
		})

		// Run the tests
		return new Promise<void>((resolve, reject) => {
			mocha.run(async (failures) => {
				// Clean up test environment
				try {
					await teardownTestEnvironment()
				} catch (error) {
					console.error("Error during test cleanup:", error)
				}

				if (failures > 0) {
					reject(new Error(`${failures} tests failed.`))
				} else {
					console.log("All tests passed!")
					resolve()
				}
			})
		})
	} catch (error) {
		console.error("Error setting up tests:", error)
		throw error
	}
}

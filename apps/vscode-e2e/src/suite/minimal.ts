import * as path from "path"
import Mocha from "mocha"
import { glob } from "glob"

export async function run() {
	console.log("Starting minimal test suite without extension activation...")

	const mochaOptions: Mocha.MochaOptions = {
		ui: "tdd",
		timeout: 10 * 1_000, // 10s
	}

	const mocha = new Mocha(mochaOptions)
	const cwd = path.resolve(__dirname, "..")

	// Only run extension.test.js as a minimal test
	const testFiles = await glob("**/extension.test.js", { cwd })

	if (testFiles.length === 0) {
		console.error("No test files found")
		throw new Error("No test files found")
	}

	console.log(`Found ${testFiles.length} test files`)
	testFiles.forEach((testFile) => {
		console.log(`Adding test file: ${testFile}`)
		mocha.addFile(path.resolve(cwd, testFile))
	})

	return new Promise<void>((resolve, reject) => {
		console.log("Running mocha tests...")
		mocha.run((failures) => {
			if (failures === 0) {
				console.log("All tests passed!")
				resolve()
			} else {
				console.error(`${failures} tests failed`)
				reject(new Error(`${failures} tests failed.`))
			}
		})
	})
}

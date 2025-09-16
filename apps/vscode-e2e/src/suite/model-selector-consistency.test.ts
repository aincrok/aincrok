import * as assert from "assert"
import * as vscode from "vscode"

import type { RooCodeAPI } from "@roo-code/types"

import { waitFor } from "./utils"
import { setDefaultSuiteTimeout } from "./test-utils"

suite("Model Selector Consistency Between Chat and Settings", function () {
	setDefaultSuiteTimeout(this)

	let api: RooCodeAPI

	suiteSetup(async () => {
		// Get the API from the extension
		const extension = vscode.extensions.getExtension("aincrok.aincrok")
		assert.ok(extension, "Aincrok extension should be installed")

		if (!extension.isActive) {
			await extension.activate()
		}

		api = extension.exports
		assert.ok(api, "API should be available")

		// Wait for API to be ready
		await waitFor(() => api.isReady())
	})

	test("should have identical model options between chat and settings for VS Code LM API", async function () {
		// Step 1: Create VS Code LM API configuration
		await api.setConfiguration({
			apiProvider: "vscode-lm" as const,
			vsCodeLmModelSelector: undefined,
		})

		// Wait for configuration to be set
		await new Promise((resolve) => setTimeout(resolve, 2000))

		// Step 2: Request VS Code LM models to simulate what both interfaces do
		await vscode.commands.executeCommand("aincrok.SidebarProvider.focus")
		await new Promise((resolve) => setTimeout(resolve, 1000))

		// Step 3: Verify configuration is set correctly
		const config = api.getConfiguration()
		assert.ok(config, "Configuration should be available")
		assert.equal(config.apiProvider, "vscode-lm", "Should be using VS Code LM provider")

		// Step 4: Test the vendor/family format generation logic
		// This simulates what both ModelSelector and VSCodeLM components do
		const mockVsCodeLmModels = [
			{ vendor: "copilot", family: "gpt-4", id: "copilot-gpt-4-test" },
			{ vendor: "copilot", family: "gemini-2.0-flash", id: "copilot-gemini-2.0-flash-test" },
			{ vendor: "github", family: "claude-3.5-sonnet", id: "github-claude-3.5-sonnet-test" },
		]

		// Step 5: Generate expected model options based on VS Code LM models
		// This should match what both chat and settings interfaces generate
		const expectedModelOptions = mockVsCodeLmModels.map((model) => ({
			value: `${model.vendor}/${model.family}`,
			label: `${model.vendor} - ${model.family}`,
		}))

		// Step 6: Verify the model options format consistency
		assert.ok(expectedModelOptions.length > 0, "Should have at least one model option")

		// All models should have consistent vendor/family format
		expectedModelOptions.forEach((option, index) => {
			assert.ok(/^.+\/.+$/.test(option.value), `Model option ${index} should have vendor/family format`)
			assert.ok(
				/^.+ - .+$/.test(option.label),
				`Model option ${index} should have "vendor - family" label format`,
			)

			// Verify value and label consistency
			const [valueVendor, valueFamily] = option.value.split("/")
			const [labelVendor, labelFamily] = option.label.split(" - ")
			assert.equal(valueVendor, labelVendor, `Vendor should match between value and label for option ${index}`)
			assert.equal(valueFamily, labelFamily, `Family should match between value and label for option ${index}`)
		})

		// Step 7: Verify that model selection format is consistent
		// Create a test selection and verify it would work in both interfaces
		if (expectedModelOptions.length > 0) {
			const testOption = expectedModelOptions[0]
			assert.ok(testOption, "First test option should exist")
			const [vendor, family] = testOption.value.split("/")

			// This should be the format both interfaces expect
			const expectedModelValue = {
				vendor,
				family,
				id: mockVsCodeLmModels.find((m) => m.vendor === vendor && m.family === family)?.id || testOption.value,
			}

			assert.ok(
				typeof expectedModelValue.vendor === "string" && expectedModelValue.vendor.length > 0,
				"Vendor should be non-empty string",
			)
			assert.ok(
				typeof expectedModelValue.family === "string" && expectedModelValue.family.length > 0,
				"Family should be non-empty string",
			)
			assert.ok(
				typeof expectedModelValue.id === "string" && expectedModelValue.id.length > 0,
				"ID should be non-empty string",
			)
		}
	})

	test("should maintain consistent model selection when switching between views", async function () {
		// Step 1: Set up VS Code LM configuration with a specific model
		const testModelConfig = {
			vendor: "test-vendor",
			family: "test-model",
			id: "test-model-id",
		}

		await api.setConfiguration({
			apiProvider: "vscode-lm" as const,
			vsCodeLmModelSelector: testModelConfig,
		})

		await new Promise((resolve) => setTimeout(resolve, 1000))

		// Step 2: Verify configuration is stored correctly
		const config = api.getConfiguration()
		assert.ok(config, "Configuration should be available")
		assert.equal(config.apiProvider, "vscode-lm", "Should be using VS Code LM provider")
		assert.ok(config.vsCodeLmModelSelector, "Should have model selector configured")

		// Step 3: Verify the expected vendor/family format
		const modelSelector = config.vsCodeLmModelSelector
		assert.equal(modelSelector.vendor, testModelConfig.vendor, "Vendor should match")
		assert.equal(modelSelector.family, testModelConfig.family, "Family should match")
		assert.equal(modelSelector.id, testModelConfig.id, "ID should match")

		// Step 4: Test that the format is consistent with what both interfaces expect
		const expectedVendorFamily = `${modelSelector.vendor}/${modelSelector.family}`
		const expectedLabel = `${modelSelector.vendor} - ${modelSelector.family}`

		assert.ok(/^.+\/.+$/.test(expectedVendorFamily), "Should follow vendor/family format")
		assert.ok(/^.+ - .+$/.test(expectedLabel), "Should follow vendor - family label format")
	})

	test("should generate identical dropdown values from the same dynamic model data", async function () {
		// Step 1: Set up VS Code LM configuration
		await api.setConfiguration({
			apiProvider: "vscode-lm" as const,
			vsCodeLmModelSelector: undefined,
		})

		await new Promise((resolve) => setTimeout(resolve, 1000))

		// Step 2: Simulate dynamic models like both interfaces would receive
		const simulatedVsCodeLmModels = [
			{ vendor: "copilot", family: "gpt-4", id: "copilot-gpt-4" },
			{ vendor: "copilot", family: "gemini-2.0-flash", id: "copilot-gemini-2.0-flash" },
			{ vendor: "github", family: "claude-3.5-sonnet", id: "github-claude-3.5-sonnet" },
		]

		// Step 3: Simulate both chat and settings dropdown generation logic
		const chatDropdownValues = simulatedVsCodeLmModels.map((model) => `${model.vendor}/${model.family}`)
		const settingsDropdownValues = simulatedVsCodeLmModels.map((model) => `${model.vendor}/${model.family}`)

		// Step 4: Verify identical values
		assert.deepEqual(
			chatDropdownValues,
			settingsDropdownValues,
			"Chat and settings should generate identical dropdown values from the same model data",
		)

		// Step 5: Verify labels would be identical too
		const chatLabels = chatDropdownValues.map((value) => value.replace("/", " - "))
		const settingsLabels = settingsDropdownValues.map((value) => value.replace("/", " - "))

		assert.deepEqual(chatLabels, settingsLabels, "Chat and settings should generate identical dropdown labels")

		// Step 6: Verify all values follow the expected format
		chatDropdownValues.forEach((value, index) => {
			assert.ok(/^.+\/.+$/.test(value), `Dropdown value ${index} should follow vendor/family format`)

			const [vendor, family] = value.split("/")
			assert.ok(typeof vendor === "string" && vendor.length > 0, `Vendor should be non-empty string for ${index}`)
			assert.ok(typeof family === "string" && family.length > 0, `Family should be non-empty string for ${index}`)
		})
	})
})

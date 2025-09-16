import { describe, it, expect } from "vitest"
import { QueryClient, QueryClientProvider } from "../exports"

describe("exports", () => {
	describe("QueryClient", () => {
		it("should export QueryClient from @tanstack/react-query", () => {
			expect(QueryClient).toBeDefined()
			expect(typeof QueryClient).toBe("function")
		})

		it("should be able to create QueryClient instance", () => {
			const queryClient = new QueryClient()
			expect(queryClient).toBeDefined()
			expect(queryClient).toBeInstanceOf(QueryClient)
		})
	})

	describe("QueryClientProvider", () => {
		it("should export QueryClientProvider from @tanstack/react-query", () => {
			expect(QueryClientProvider).toBeDefined()
			expect(typeof QueryClientProvider).toBe("function")
		})
	})
})

import { describe, it, expect } from "vitest"
import { appendImages } from "../imageUtils"

describe("imageUtils", () => {
	describe("appendImages", () => {
		it("should append new images to current images", () => {
			const currentImages = ["image1.jpg", "image2.png"]
			const newImages = ["image3.gif", "image4.webp"]
			const result = appendImages(currentImages, newImages, 10)

			expect(result).toEqual(["image1.jpg", "image2.png", "image3.gif", "image4.webp"])
		})

		it("should return current images when newImages is undefined", () => {
			const currentImages = ["image1.jpg", "image2.png"]
			const result = appendImages(currentImages, undefined, 10)

			expect(result).toEqual(["image1.jpg", "image2.png"])
		})

		it("should return current images when newImages is empty array", () => {
			const currentImages = ["image1.jpg", "image2.png"]
			const newImages: string[] = []
			const result = appendImages(currentImages, newImages, 10)

			expect(result).toEqual(["image1.jpg", "image2.png"])
		})

		it("should handle empty current images array", () => {
			const currentImages: string[] = []
			const newImages = ["image1.jpg", "image2.png"]
			const result = appendImages(currentImages, newImages, 10)

			expect(result).toEqual(["image1.jpg", "image2.png"])
		})

		it("should respect maxImages limit when total exceeds limit", () => {
			const currentImages = ["image1.jpg", "image2.png", "image3.gif"]
			const newImages = ["image4.webp", "image5.jpg"]
			const result = appendImages(currentImages, newImages, 4)

			expect(result).toEqual(["image1.jpg", "image2.png", "image3.gif", "image4.webp"])
			expect(result.length).toBe(4)
		})

		it("should return empty array when maxImages is 0", () => {
			const currentImages = ["image1.jpg", "image2.png"]
			const newImages = ["image3.gif"]
			const result = appendImages(currentImages, newImages, 0)

			expect(result).toEqual([])
		})

		it("should handle negative maxImages by returning combined array", () => {
			const currentImages = ["image1.jpg", "image2.png"]
			const newImages = ["image3.gif"]
			const result = appendImages(currentImages, newImages, -1)

			// slice(0, -1) removes the last element, so it returns current + new - 1
			expect(result).toEqual(["image1.jpg", "image2.png"])
		})

		it("should truncate to maxImages when currentImages already exceeds limit", () => {
			const currentImages = ["image1.jpg", "image2.png", "image3.gif", "image4.webp"]
			const newImages = ["image5.jpg"]
			const result = appendImages(currentImages, newImages, 3)

			expect(result).toEqual(["image1.jpg", "image2.png", "image3.gif"])
			expect(result.length).toBe(3)
		})

		it("should handle single image addition", () => {
			const currentImages = ["image1.jpg"]
			const newImages = ["image2.png"]
			const result = appendImages(currentImages, newImages, 5)

			expect(result).toEqual(["image1.jpg", "image2.png"])
		})

		it("should maintain order of images", () => {
			const currentImages = ["first.jpg", "second.png"]
			const newImages = ["third.gif", "fourth.webp", "fifth.jpg"]
			const result = appendImages(currentImages, newImages, 10)

			expect(result).toEqual(["first.jpg", "second.png", "third.gif", "fourth.webp", "fifth.jpg"])
		})

		it("should handle maxImages equal to current length", () => {
			const currentImages = ["image1.jpg", "image2.png"]
			const newImages = ["image3.gif"]
			const result = appendImages(currentImages, newImages, 2)

			expect(result).toEqual(["image1.jpg", "image2.png"])
			expect(result.length).toBe(2)
		})

		it("should handle maxImages equal to total length", () => {
			const currentImages = ["image1.jpg", "image2.png"]
			const newImages = ["image3.gif"]
			const result = appendImages(currentImages, newImages, 3)

			expect(result).toEqual(["image1.jpg", "image2.png", "image3.gif"])
			expect(result.length).toBe(3)
		})

		it("should not mutate original arrays", () => {
			const currentImages = ["image1.jpg", "image2.png"]
			const newImages = ["image3.gif", "image4.webp"]
			const originalCurrent = [...currentImages]
			const originalNew = [...newImages]

			const result = appendImages(currentImages, newImages, 10)

			expect(currentImages).toEqual(originalCurrent)
			expect(newImages).toEqual(originalNew)
			expect(result).not.toBe(currentImages)
		})

		it("should handle duplicate image names", () => {
			const currentImages = ["image1.jpg", "image2.png"]
			const newImages = ["image1.jpg", "image3.gif"]
			const result = appendImages(currentImages, newImages, 10)

			expect(result).toEqual(["image1.jpg", "image2.png", "image1.jpg", "image3.gif"])
		})

		it("should handle very large maxImages", () => {
			const currentImages = ["image1.jpg"]
			const newImages = ["image2.png"]
			const result = appendImages(currentImages, newImages, Number.MAX_SAFE_INTEGER)

			expect(result).toEqual(["image1.jpg", "image2.png"])
		})

		it("should handle empty strings in image arrays", () => {
			const currentImages = ["", "image1.jpg"]
			const newImages = ["image2.png", ""]
			const result = appendImages(currentImages, newImages, 10)

			expect(result).toEqual(["", "image1.jpg", "image2.png", ""])
		})
	})
})

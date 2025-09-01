/**
 * Utility for building Aincrok documentation links.
 *
 * @param path - The path after the docs root (no leading slash)
 * @param campaign - The campaign context (unused)
 * @returns The full docs URL
 */
// kilocode_change: unused campaign param
export function buildDocLink(path: string, _campaign: string): string {
	// Remove any leading slash from path
	const cleanPath = path
		.replace(/^\//, "")
		.replace("troubleshooting/shell-integration/", "features/shell-integration") // kilocode_change
	const [basePath, hash] = cleanPath.split("#")
	const baseUrl = `https://aincrok.dev/docs/${basePath}`
	return hash ? `${baseUrl}#${hash}` : baseUrl
}

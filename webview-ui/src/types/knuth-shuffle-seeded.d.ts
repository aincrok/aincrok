declare module "knuth-shuffle-seeded" {
	function shuffle<T>(array: T[], seed?: number): T[]
	export = shuffle
}

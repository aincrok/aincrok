import { themes as prismThemes } from "prism-react-renderer"
import type { Config } from "@docusaurus/types"
import type * as Preset from "@docusaurus/preset-classic"
import {
	DISCORD_URL,
	REDDIT_URL,
	TWITTER_URL,
	GITHUB_MAIN_REPO_URL,
	GITHUB_ISSUES_MAIN_URL,
	GITHUB_FEATURES_URL,
	VSCODE_MARKETPLACE_URL,
	OPEN_VSX_URL,
	CONTACT_EMAIL,
	CAREERS_URL,
	WEBSITE_PRIVACY_URL,
	EXTENSION_PRIVACY_URL,
	GITHUB_REPO_URL,
} from "./src/constants"

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
	title: "Aincrok Docs",
	tagline: "Aincrok Documentation",
	favicon: "img/favicon.ico",

	// Set the production url of your site here
	url: "https://aincrok.dev",
	// Set the /<baseUrl>/ pathname under which your site is served
	// For GitHub pages deployment, it is often '/<projectName>/'
	baseUrl: "/",

	customFields: {
		freeTierAmount: process.env.FREE_TIER_AMOUNT || "$20",
	},

	onBrokenLinks: "warn",
	onBrokenMarkdownLinks: "warn",

	// Even if you don't use internationalization, you can use this field to set
	// useful metadata like html lang. For example, if your site is Chinese, you
	// may want to replace "en" with "zh-Hans".
	i18n: {
		defaultLocale: "en",
		locales: ["en"],
	},

	presets: [
		[
			"classic",
			{
				docs: {
					sidebarPath: "./sidebars.ts",
					routeBasePath: "docs",
					editUrl: `${GITHUB_REPO_URL}/edit/main/`,
					showLastUpdateTime: true,
				},
				blog: false, // Disable blog feature
				sitemap: {
					lastmod: "date",
					priority: null,
					changefreq: null,
				},
				theme: {
					customCss: "./src/css/custom.css",
				},
			} satisfies Preset.Options,
		],
	],

	themes: [
		[
			require.resolve("@easyops-cn/docusaurus-search-local"),
			{
				hashed: true,
				language: ["en"],
				highlightSearchTermsOnTargetPage: false,
				explicitSearchResultPath: true,
				docsRouteBasePath: "docs",
			},
		],
	],

	plugins: [
		...(process.env.POSTHOG_API_KEY
			? [
					[
						"posthog-docusaurus",
						{
							apiKey: process.env.POSTHOG_API_KEY,
							appUrl: "https://us.i.posthog.com",
							enableInDevelopment: true,
						},
					],
				]
			: []),
		// Temporarily disable redirects to get build working
		// [
		// 	"@docusaurus/plugin-client-redirects",
		// 	{
		// 		redirects: [
		// 			// Will add back redirects once pages exist
		// 		],
		// 	},
		// ],
	],

	stylesheets: [
		{
			href: "/css/dark-theme-force.css",
			type: "text/css",
		},
	],
	scripts: [
		{
			src: "data:text/javascript;base64,KGZ1bmN0aW9uKCkge2RvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2RhdGEtdGhlbWUnLCAnZGFyaycpO2xvY2FsU3RvcmFnZS5zZXRJdGVtKCd0aGVtZScsICdkYXJrJyk7fSkoKTs=",
			async: false,
		},
	],
	themeConfig: {
		image: "img/aincrok-logo.png",
		navbar: {
			title: "Aincrok",
			logo: {
				alt: "Aincrok Logo",
				src: "img/aincrok-logo.svg",
				srcDark: "img/aincrok-logo-white.svg",
				href: "/",
				target: "_self",
			},
			items: [
				{
					href: GITHUB_MAIN_REPO_URL,
					label: "GitHub",
					position: "right",
				},
				{
					href: VSCODE_MARKETPLACE_URL,
					label: "Install Extension",
					position: "right",
				},
				{
					type: "localeDropdown",
					position: "right",
				},
			],
		},
		footer: {
			style: "dark",
			links: [
				{
					title: "Community",
					items: [
						{
							label: "Discord",
							href: DISCORD_URL,
						},
						{
							label: "Reddit",
							href: REDDIT_URL,
						},
						{
							label: "Twitter",
							href: TWITTER_URL,
						},
					],
				},
				{
					title: "GitHub",
					items: [
						{
							label: "Issues",
							href: GITHUB_ISSUES_MAIN_URL,
						},
						{
							label: "Feature Requests",
							href: GITHUB_FEATURES_URL,
						},
					],
				},
				{
					title: "Download",
					items: [
						{
							label: "VS Code Marketplace",
							href: VSCODE_MARKETPLACE_URL,
						},
						{
							label: "Open VSX Registry",
							href: OPEN_VSX_URL,
						},
					],
				},
				{
					title: "Company",
					items: [
						{
							label: "Contact",
							href: CONTACT_EMAIL,
							target: "_self",
						},
						{
							label: "Careers",
							href: CAREERS_URL,
						},
						{
							label: "Website Privacy Policy",
							href: WEBSITE_PRIVACY_URL,
						},
						{
							label: "Extension Privacy Policy",
							href: EXTENSION_PRIVACY_URL,
						},
					],
				},
			],
		},
		colorMode: {
			defaultMode: "dark",
			disableSwitch: true,
			respectPrefersColorScheme: false,
		},
		prism: {
			theme: prismThemes.github,
			darkTheme: prismThemes.dracula,
		},
	} satisfies Preset.ThemeConfig,
}

export default config

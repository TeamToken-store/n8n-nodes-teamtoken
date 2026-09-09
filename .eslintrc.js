/**
 * @type {import('@types/eslint').ESLint.ConfigData}
 */
module.exports = {
	root: true,

	env: {
		browser: true,
		es6: true,
		node: true,
	},

	parser: '@typescript-eslint/parser',

	parserOptions: {
		// tsconfig.eslint.json extends tsconfig.json and additionally includes
		// package.json, which the plugin's community rules need to parse. Keeping it
		// out of the build tsconfig stops tsc from emitting a stray dist/package.json.
		project: ['./tsconfig.eslint.json'],
		sourceType: 'module',
		extraFileExtensions: ['.json'],
	},

	ignorePatterns: ['.eslintrc.js', '.eslintrc.prepublish.js', '**/*.js', '**/node_modules/**', '**/dist/**'],

	overrides: [
		{
			files: ['package.json'],
			plugins: ['eslint-plugin-n8n-nodes-base'],
			extends: ['plugin:n8n-nodes-base/community'],
			rules: {
				'n8n-nodes-base/community-package-json-name-still-default': 'off',
			},
		},
		{
			files: ['./credentials/**/*.ts'],
			plugins: ['eslint-plugin-n8n-nodes-base'],
			extends: ['plugin:n8n-nodes-base/credentials'],
			rules: {
				// This rule camelCases the documentationUrl VALUE, which mangles any
				// real URL — it contradicts cred-...-not-http-url (which requires a
				// valid http URL). Keep the URL; disable the buggy casing check.
				'n8n-nodes-base/cred-class-field-documentation-url-miscased': 'off',
			},
		},
		{
			files: ['./nodes/**/*.ts'],
			plugins: ['eslint-plugin-n8n-nodes-base'],
			extends: ['plugin:n8n-nodes-base/nodes'],
			rules: {
				// These two n8n-nodes-base rules demand the string literal `['main']`
				// in inputs/outputs, which directly contradicts the community-registry
				// rule `@n8n/community-nodes/node-connection-type-literal` (the scan
				// gate) — that one MANDATES `NodeConnectionTypes.Main`. The official
				// scanner resolves the conflict by turning these two off; we mirror it
				// so local lint agrees with the gate that decides verification.
				'n8n-nodes-base/node-class-description-inputs-wrong-regular-node': 'off',
				'n8n-nodes-base/node-class-description-outputs-wrong': 'off',
			},
		},
	],
};

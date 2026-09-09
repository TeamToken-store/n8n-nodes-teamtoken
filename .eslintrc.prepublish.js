/**
 * Stricter config run by `prepublishOnly`, so the community-registry rules that
 * only matter at publish time cannot be forgotten. Mirrors the n8n scaffold.
 *
 * @type {import('@types/eslint').ESLint.ConfigData}
 */
module.exports = {
	extends: './.eslintrc.js',
	overrides: [
		{
			files: ['package.json'],
			plugins: ['eslint-plugin-n8n-nodes-base'],
			rules: {
				'n8n-nodes-base/community-package-json-name-still-default': 'error',
			},
		},
	],
};

module.exports = {
	parser: '@typescript-eslint/parser',
	parserOptions: {
		project: 'tsconfig.json',
		tsconfigRootDir: __dirname,
		sourceType: 'module',
	},
	plugins: ['@typescript-eslint', 'prettier', 'import'],
	extends: ['plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
	root: true,
	env: {
		node: true,
		jest: true,
	},
	ignorePatterns: ['.eslintrc.js', '**/*.spec.ts'],
	rules: {
		'no-restricted-imports': 'off',
		'import/no-unresolved': 'off',
		'import/no-relative-parent-imports': 'off',
		'@typescript-eslint/no-empty-function': 'error',
		'@typescript-eslint/explicit-function-return-type': 'warn',
		'@typescript-eslint/no-explicit-any': 'warn',
		'@typescript-eslint/no-unused-vars':  [
			"error",
			{ "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }
		  ],
		'@typescript-eslint/no-var-requires': 'error',
		'@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
		'@typescript-eslint/explicit-member-accessibility': 'off',
		'@typescript-eslint/no-non-null-assertion': 'error',
		'@typescript-eslint/no-namespace': 'error',
		'no-console': 'error',
		'@typescript-eslint/naming-convention': [
			'error',
			{
				selector: 'default',
				format: ['camelCase'],
			},
			{
				selector: 'variable',
				format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
				leadingUnderscore: 'allow',
			},
			{
				selector: 'function',
				format: ['camelCase', 'PascalCase'],
			},
			{
				selector: 'parameter',
				format: ['camelCase'],
				leadingUnderscore: 'allow',
			},
			{
				selector: 'property',
				format: ['camelCase', 'snake_case', 'UPPER_CASE'],
			},
			{
				selector: 'method',
				format: ['camelCase', 'PascalCase'],
			},
			{
				selector: 'interface',
				format: ['PascalCase'],
				custom: {
					regex: '^I[A-Z]',
					match: true,
				},
			},
			{
				selector: 'class',
				format: ['PascalCase'],
			},
			{
				selector: 'enum',
				format: ['PascalCase'],
			},
			{
				selector: 'enumMember',
				format: ['UPPER_CASE'],
			},
			{
				selector: 'typeAlias',
				format: ['PascalCase'],
			},
			{
				selector: 'typeParameter',
				format: ['PascalCase', 'UPPER_CASE'],
				custom: {
					regex: '^[A-Z]$|^[A-Z][a-zA-Z]+$',
					match: true,
				},
			},
			{
				selector: 'objectLiteralProperty',
				format: null,
				modifiers: ['requiresQuotes'],
			},
			{
				selector: 'objectLiteralProperty',
				format: ['camelCase', 'snake_case', 'UPPER_CASE'],
				filter: {
					regex: '(^\\{\\{.*\\}\\}$)|(_rows$)',
					match: false,
				},
			},
			{
				selector: 'objectLiteralMethod',
				format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
			},
			{
				selector: 'import',
				format: ['camelCase', 'PascalCase'],
			},
		],
		'prettier/prettier': 'error',
	},
	settings: {
		'import/resolver': {
			typescript: {
				project: './tsconfig.json',
			},
		},
	},
}

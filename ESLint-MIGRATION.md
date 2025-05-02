# ESLint Configuration Migration

This project has been migrated to use ESLint 9.x with the new flat configuration format.

## Changes Made

1. Created a new `eslint.config.js` file in the project root
2. Added `"type": "module"` to package.json to support ECMAScript modules
3. Installed required dependencies:
   - eslint-plugin-prettier
   - eslint-config-prettier
   - eslint-plugin-import
   - eslint-formatter-codeframe

## Current Configuration

The current ESLint configuration is designed to be lenient during the migration process:

- TypeScript rules are set to `warn` instead of `error`
- Naming convention rules are temporarily disabled
- Global variables (like `console`, `process`, etc.) are defined to avoid undefined errors
- Test files and spec files are ignored

## Future Improvements

Over time, the configuration should be tightened to enforce stricter rules:

1. Re-enable naming convention rules (especially for interfaces)
2. Change warning levels back to errors for critical issues
3. Add more specific rules for code quality
4. Reduce usage of `any` types

## Usage

Run ESLint with the following commands:

```bash
# Check for issues without fixing
npm run lint

# Fix issues automatically where possible
npm run lint:fix
```

## Troubleshooting

If you encounter issues with the ESLint configuration:

1. Make sure all dependencies are installed:
   ```bash
   npm install
   ```

2. For issues with missing formatters:
   ```bash
   npm install -D eslint-formatter-codeframe
   ```

3. For module-related errors, verify `"type": "module"` is in package.json
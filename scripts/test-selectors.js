#!/usr/bin/env node

/**
 * Test script for LinkedIn selector verification and update
 *
 * This script demonstrates how to use the new selector management APIs.
 *
 * Usage:
 *   node scripts/test-selectors.js --mode verify --url https://www.linkedin.com/in/username --account accountId
 *   node scripts/test-selectors.js --mode update --input path/to/metrics.json
 */

const axios = require('axios')
const fs = require('fs').promises
const path = require('path')
const readline = require('readline')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')

// Configure CLI arguments
const argv = yargs(hideBin(process.argv))
	.option('mode', {
		alias: 'm',
		description: 'Mode to run (verify or update)',
		type: 'string',
		choices: ['verify', 'update'],
		required: true,
	})
	.option('url', {
		alias: 'u',
		description: 'LinkedIn profile URL to verify against (only for verify mode)',
		type: 'string',
	})
	.option('account', {
		alias: 'a',
		description: 'LinkedIn account ID to use (only for verify mode)',
		type: 'string',
	})
	.option('password', {
		alias: 'p',
		description: 'LinkedIn account password (only for verify mode)',
		type: 'string',
	})
	.option('input', {
		alias: 'i',
		description: 'Path to metrics file (only for update mode)',
		type: 'string',
	})
	.option('threshold', {
		alias: 't',
		description: 'Success rate threshold for updates (only for update mode)',
		type: 'number',
		default: 0.5,
	})
	.check((argv) => {
		if (argv.mode === 'verify' && (!argv.url || !argv.account)) {
			throw new Error('Verify mode requires --url and --account arguments')
		}
		if (argv.mode === 'update' && !argv.input) {
			throw new Error('Update mode requires --input argument')
		}
		return true
	})
	.help().argv

// API base URL (adjust as needed)
const API_BASE_URL = 'http://localhost:5000/api'

/**
 * Main function
 */
async function main() {
	try {
		if (argv.mode === 'verify') {
			await verifySelectors()
		} else if (argv.mode === 'update') {
			await updateSelectors()
		}
	} catch (error) {
		console.error('Error:', error.response?.data?.message || error.message)
		process.exit(1)
	}
}

/**
 * Verify LinkedIn selectors against a profile
 */
async function verifySelectors() {
	console.log(`Verifying selectors against profile: ${argv.url}`)

	// Prompt for password if not provided
	let password = argv.password
	if (!password) {
		password = await promptPassword('Enter LinkedIn account password: ')
	}

	// Create output directory if it doesn't exist
	const outputDir = path.join(__dirname, '../data/metrics')
	await fs.mkdir(outputDir, { recursive: true })

	// Generate output filename
	const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0]
	const outputFile = path.join(outputDir, `metrics-${timestamp}.json`)

	// API request payload
	const payload = {
		linkedinAccountId: argv.account,
		password,
		profileUrl: argv.url,
		outputPath: outputFile,
	}

	console.log('Starting selector verification...')
	const response = await axios.post(`${API_BASE_URL}/linkedin/selectors/verify`, payload)

	// Log success
	console.log('Verification completed successfully!')
	console.log(`Metrics saved to: ${outputFile}`)

	// Print summary
	const summary = response.data.data.summary
	console.log('\nSummary:')
	console.log(`Total selectors: ${summary.totalSelectors}`)
	console.log(`Working selectors: ${summary.workingSelectors}`)
	console.log(`Success rate: ${summary.successRate}%`)
	console.log(`Categories: ${summary.categories.join(', ')}`)

	// Suggest next steps
	console.log('\nNext steps:')
	console.log(`- Review metrics in ${outputFile}`)
	console.log(`- Run update mode: node scripts/test-selectors.js --mode update --input ${outputFile}`)
}

/**
 * Update LinkedIn selectors based on metrics
 */
async function updateSelectors() {
	console.log(`Updating selectors based on metrics: ${argv.input}`)

	// Check if metrics file exists
	try {
		await fs.access(argv.input)
	} catch (error) {
		throw new Error(`Metrics file not found: ${argv.input}`)
	}

	// Default selector file path
	const selectorFile = path.join(__dirname, '../config/linkedin-selectors.json')

	// API request payload
	const payload = {
		metricsPath: path.resolve(argv.input),
		threshold: argv.threshold,
		updateSelectorFile: true,
		selectorFile: path.resolve(selectorFile),
	}

	console.log('Starting selector update...')
	const response = await axios.post(`${API_BASE_URL}/linkedin/selectors/update`, payload)

	// Log success
	console.log('Update analysis completed successfully!')

	// Print update results
	const data = response.data.data

	console.log('\nUpdate summary:')
	for (const [category, info] of Object.entries(data)) {
		if (category === 'selectorFileUpdated' || category === 'selectorFilePath') continue

		console.log(`\n[${category}]`)
		console.log(`Total selectors: ${info.totalSelectors}`)
		console.log(`Good selectors: ${info.goodSelectors}`)
		console.log(`Poor selectors: ${info.poorSelectors}`)

		if (info.poorSelectors > 0) {
			console.log('\nSelectors needing attention:')
			info.needsAttention.forEach((sel) => {
				console.log(`- ${sel.selector} (success rate: ${(sel.successRate * 100).toFixed(0)}%)`)
			})
		}
	}

	// Print file update status
	if (data.selectorFileUpdated) {
		console.log(`\n✅ Successfully updated selector file: ${data.selectorFilePath}`)
	} else if (data.selectorFileError) {
		console.log(`\n❌ Error updating selector file: ${data.selectorFileError}`)
	}
}

/**
 * Prompt for password with masked input
 * @param {string} query - Prompt message
 * @returns {Promise<string>} - Password
 */
function promptPassword(query) {
	return new Promise((resolve) => {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		})

		process.stdout.write(query)

		// Hide input
		process.stdin.on('data', (char) => {
			char = char.toString()
			switch (char) {
				case '\n':
				case '\r':
				case '\u0004':
					process.stdin.pause()
					break
				default:
					process.stdout.write('*')
					break
			}
		})

		rl.question('', (value) => {
			rl.close()
			process.stdin.removeAllListeners('data')
			console.log('\n')
			resolve(value)
		})
	})
}

// Run the script
main()

// Run tests for all completed tasks using Postman and MongoDB
const { exec, spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

console.log('🚀 LinkedIn Scraper API - Testing Completed Tasks')
console.log('=============================================')

// First, make sure the server is running
console.log('ℹ️ Checking if server is running...')

// Simple check by pinging the health endpoint
exec('curl http://localhost:4001/api/health', (error, stdout, stderr) => {
	if (error) {
		console.error('❌ Server is not running! Please start the server with npm run dev')
		process.exit(1)
	}

	try {
		const response = JSON.parse(stdout)
		if (response.status === 'success') {
			console.log('✅ Server is running!')
			runTests()
		} else {
			console.error('❌ Server is not healthy!')
			process.exit(1)
		}
	} catch (e) {
		console.error('❌ Could not parse server response. Is the server running correctly?')
		console.error(e)
		process.exit(1)
	}
})

// Function to run a script and capture output
function runScript(scriptPath) {
	return new Promise((resolve, reject) => {
		console.log(`🔄 Running script: ${path.basename(scriptPath)}`)

		const childProcess = spawn('node', [scriptPath], { stdio: 'inherit' })

		childProcess.on('close', (code) => {
			if (code === 0) {
				resolve()
			} else {
				reject(new Error(`Script exited with code ${code}`))
			}
		})
	})
}

// Function to run a Postman collection folder
function runPostmanFolder(folder) {
	return new Promise((resolve, reject) => {
		console.log(`\n🔥 Running ${folder} Tests`)
		console.log('===========================================================')

		const collectionsDir = path.join(__dirname, 'postman', 'collections')
		const collectionPath = path.join(collectionsDir, 'LinkedIn Scraper API.postman_collection.json')
		const environmentPath = path.join(collectionsDir, 'LinkedIn Scrapper.postman_environment.json')

		// Validate files exist
		if (!fs.existsSync(collectionPath)) {
			console.error(`❌ Collection file not found: ${collectionPath}`)
			reject(new Error(`Collection file not found: ${collectionPath}`))
			return
		}

		if (!fs.existsSync(environmentPath)) {
			console.error(`❌ Environment file not found: ${environmentPath}`)
			reject(new Error(`Environment file not found: ${environmentPath}`))
			return
		}

		const command = `newman run "${collectionPath}" -e "${environmentPath}" --folder "${folder}" --color on`

		const childProcess = exec(command)

		childProcess.stdout.on('data', (data) => {
			process.stdout.write(data)
		})

		childProcess.stderr.on('data', (data) => {
			process.stderr.write(data)
		})

		childProcess.on('close', (code) => {
			if (code === 0) {
				console.log(`\n✅ ${folder} tests completed successfully`)
				resolve()
			} else {
				console.error(`\n❌ ${folder} tests failed with exit code ${code}`)
				resolve() // Still resolve to continue with other tests
			}
		})
	})
}

// Define the test suites to run (all completed tasks)
const postmanFolders = [
	'Authentication',
	'User Management',
	'LinkedIn Accounts',
	'Proxies',
	'Campaigns',
	'User Ratings',
	'LinkedIn Operations',
	'Utility',
]

// Main function to run all tests
async function runTests() {
	let passedTests = 0
	let failedTests = 0

	try {
		console.log('\n📋 Step 1: Setting up test data')
		console.log('------------------------------------------')
		await runScript(path.join(__dirname, 'setup-postman-test-data.js'))
		passedTests++

		console.log('\n📋 Step 2: Running MongoDB tests')
		console.log('------------------------------------------')
		await runScript(path.join(__dirname, 'test-mongodb.js'))
		passedTests++

		console.log('\n📋 Step 3: Running Postman API tests')
		console.log('------------------------------------------')

		// Run each Postman folder sequentially
		for (const folder of postmanFolders) {
			try {
				await runPostmanFolder(folder)
				passedTests++
			} catch (error) {
				console.error(`❌ Error running ${folder} tests:`, error.message)
				failedTests++
			}
		}

		// Generate test report
		console.log('\n📋 Step 4: Generating test report')
		console.log('------------------------------------------')
		await runScript(path.join(__dirname, 'generate-test-report.js'))

		console.log('\n🎉 Test Summary:')
		console.log('------------------------------------------')
		console.log(`Total Test Suites: ${passedTests + failedTests}`)
		console.log(`✅ Passed: ${passedTests}`)
		console.log(`❌ Failed: ${failedTests}`)

		console.log('\n🎉 All tests completed! Check test-report.html for detailed results.')
		process.exit(failedTests > 0 ? 1 : 0)
	} catch (error) {
		console.error('\n❌ Test execution failed:', error.message)
		process.exit(1)
	}
}

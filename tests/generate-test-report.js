// Generate comprehensive test report for LinkedIn Scraper API
const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')

// Test collection configuration
const testGroups = [
	{
		name: 'Authentication',
		description: 'User authentication and token management',
		command:
			'newman run tests/postman/collections/LinkedIn\\ Scraper\\ API.postman_collection.json -e tests/postman/collections/LinkedIn\\ Scrapper.postman_environment.json --folder "Authentication" --reporter-cli-no-summary',
		tests: ['User Registration', 'User Login', 'Admin Registration', 'Admin Login', 'Token Refresh'],
	},
	{
		name: 'User Management',
		description: 'User profile management and admin capabilities',
		command:
			'newman run tests/postman/collections/LinkedIn\\ Scraper\\ API.postman_collection.json -e tests/postman/collections/LinkedIn\\ Scrapper.postman_environment.json --folder "User Management" --reporter-cli-no-summary',
		tests: ['Get User Profile', 'Update User Profile', 'Admin User List', 'Get User by ID', 'Update User', 'Delete User'],
	},
	{
		name: 'LinkedIn Account Management',
		description: 'LinkedIn account creation and management',
		command:
			'newman run tests/postman/collections/LinkedIn\\ Scraper\\ API.postman_collection.json -e tests/postman/collections/LinkedIn\\ Scrapper.postman_environment.json --folder "LinkedIn Accounts" --reporter-cli-no-summary',
		tests: [
			'Create LinkedIn Account',
			'List LinkedIn Accounts',
			'Get LinkedIn Account',
			'Update LinkedIn Account',
			'Get Next Available Account',
			'Delete LinkedIn Account',
		],
	},
	{
		name: 'Proxy Management',
		description: 'Proxy server configuration and management',
		command:
			'newman run tests/postman/collections/LinkedIn\\ Scraper\\ API.postman_collection.json -e tests/postman/collections/LinkedIn\\ Scrapper.postman_environment.json --folder "Proxies" --reporter-cli-no-summary',
		tests: ['Create Proxy', 'List Proxies', 'Get Proxy', 'Update Proxy', 'Get Next Available Proxy', 'Delete Proxy'],
	},
	{
		name: 'Campaign Management',
		description: 'LinkedIn search campaign creation and execution',
		command:
			'newman run tests/postman/collections/LinkedIn\\ Scraper\\ API.postman_collection.json -e tests/postman/collections/LinkedIn\\ Scrapper.postman_environment.json --folder "Campaigns" --reporter-cli-no-summary',
		tests: [
			'Create Campaign',
			'List Campaigns',
			'Get Campaign Details',
			'Update Campaign',
			'Queue Campaign',
			'Get Campaign Results',
			'Delete Campaign',
		],
	},
	{
		name: 'User Ratings',
		description: 'User rating and feedback system',
		command:
			'newman run tests/postman/collections/LinkedIn\\ Scraper\\ API.postman_collection.json -e tests/postman/collections/LinkedIn\\ Scrapper.postman_environment.json --folder "User Ratings" --reporter-cli-no-summary',
		tests: ['Rate User', 'Get User Ratings'],
	},
	{
		name: 'LinkedIn Operations',
		description: 'LinkedIn search and profile operations',
		command:
			'newman run tests/postman/collections/LinkedIn\\ Scraper\\ API.postman_collection.json -e tests/postman/collections/LinkedIn\\ Scrapper.postman_environment.json --folder "LinkedIn Operations" --reporter-cli-no-summary',
		tests: ['Test LinkedIn Login', 'Search LinkedIn Profiles'],
	},
	{
		name: 'Database Operations',
		description: 'MongoDB database operations and schema validation',
		command: 'node tests/test-mongodb.js',
		tests: ['Schema Validation', 'Database Queries', 'Data Encryption', 'Data Relationships'],
	},
	{
		name: 'Utility',
		description: 'Utility endpoints and health checks',
		command:
			'newman run tests/postman/collections/LinkedIn\\ Scraper\\ API.postman_collection.json -e tests/postman/collections/LinkedIn\\ Scrapper.postman_environment.json --folder "Utility" --reporter-cli-no-summary',
		tests: ['Health Check'],
	},
]

// Results storage
const testResults = {
	passedGroups: 0,
	totalGroups: testGroups.length,
	passedTests: 0,
	totalTests: 0,
	startTime: new Date(),
	endTime: null,
	groups: [],
}

// Parse command output to determine test results
function parseTestOutput(output, group) {
	const testResults = {
		name: group.name,
		description: group.description,
		passed: false,
		testsPassed: 0,
		testsTotal: group.tests.length,
		tests: [],
		details: '',
	}

	// Check for basic success indicators in output
	const successIndicators = ['✅', 'passed', 'successful']
	const failureIndicators = ['❌', 'failed', 'error', 'AssertionError']

	// Parse for individual test results
	group.tests.forEach((testName) => {
		const testResult = {
			name: testName,
			passed: false,
			details: '',
		}

		// Try to determine if this test passed based on output
		const lowerOutput = output.toLowerCase()
		const lowerTestName = testName.toLowerCase()

		// Look for test name and success indicators close to each other
		if (
			successIndicators.some((indicator) => lowerOutput.includes(`${lowerTestName}`) && lowerOutput.includes(indicator.toLowerCase()))
		) {
			testResult.passed = true
			testResult.details = 'Test passed successfully'
		} else if (
			failureIndicators.some((indicator) => lowerOutput.includes(`${lowerTestName}`) && lowerOutput.includes(indicator.toLowerCase()))
		) {
			testResult.passed = false

			// Try to extract failure details
			const failureLines = output
				.split('\n')
				.filter(
					(line) =>
						line.toLowerCase().includes(lowerTestName) &&
						failureIndicators.some((indicator) => line.toLowerCase().includes(indicator.toLowerCase())),
				)

			testResult.details = failureLines.length > 0 ? `Failed: ${failureLines[0]}` : 'Test failed'
		} else {
			// Can't determine status clearly
			testResult.passed = false
			testResult.details = 'Unknown status (not clearly passed/failed)'
		}

		testResults.tests.push(testResult)
	})

	// Calculate overall group metrics
	testResults.testsPassed = testResults.tests.filter((t) => t.passed).length
	testResults.passed = testResults.testsPassed === testResults.testsTotal
	testResults.details = output.substring(0, 1000) + (output.length > 1000 ? '...(truncated)' : '')

	return testResults
}

// Run a single test group and collect results
function runTestGroup(group) {
	return new Promise((resolve, reject) => {
		console.log(`\n🧪 Running ${group.name} Tests: ${group.description}`)
		console.log('============================================================')

		exec(group.command, (error, stdout, stderr) => {
			// Parse the output to determine results
			const results = parseTestOutput(stdout + '\n' + stderr, group)

			// Log a summary
			console.log(`Results: ${results.testsPassed}/${results.testsTotal} tests passed`)

			if (results.passed) {
				console.log('✅ All tests passed!')
			} else {
				console.log('❌ Some tests failed')
			}

			resolve(results)
		})
	})
}

// Generate HTML report from test results
function generateHtmlReport(results) {
	const reportPath = path.join(__dirname, 'test-report.html')

	// Calculate overall test counts
	let totalTests = 0
	let totalPassed = 0

	results.groups.forEach((group) => {
		totalTests += group.testsTotal
		totalPassed += group.testsPassed
	})

	results.totalTests = totalTests
	results.passedTests = totalPassed

	// Calculate test duration
	const duration = (results.endTime - results.startTime) / 1000

	// Generate HTML
	const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LinkedIn Scraper API Test Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #0077b5;
    }
    .summary {
      background-color: #f5f5f5;
      border-radius: 5px;
      padding: 15px;
      margin-bottom: 20px;
    }
    .group {
      margin-bottom: 30px;
      border: 1px solid #ddd;
      border-radius: 5px;
      overflow: hidden;
    }
    .group-header {
      padding: 10px 15px;
      background-color: #f0f0f0;
      border-bottom: 1px solid #ddd;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .group-name {
      font-weight: bold;
      margin: 0;
    }
    .group-status {
      font-weight: bold;
    }
    .pass {
      color: #2ecc71;
    }
    .fail {
      color: #e74c3c;
    }
    .group-body {
      padding: 15px;
    }
    .test-item {
      margin-bottom: 10px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }
    .test-item:last-child {
      border-bottom: none;
    }
    .progress-bar {
      height: 20px;
      background-color: #ecf0f1;
      border-radius: 10px;
      margin: 10px 0;
      overflow: hidden;
    }
    .progress {
      height: 100%;
      background-color: #2ecc71;
      width: ${(totalPassed / totalTests) * 100}%;
    }
    .details {
      background-color: #f9f9f9;
      border: 1px solid #ddd;
      border-radius: 3px;
      padding: 10px;
      font-family: monospace;
      font-size: 12px;
      white-space: pre-wrap;
      margin-top: 10px;
      max-height: 200px;
      overflow-y: auto;
    }
    .timestamp {
      color: #888;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <h1>LinkedIn Scraper API Test Report</h1>

  <div class="summary">
    <h2>Test Summary</h2>
    <p>
      <strong>Start Time:</strong> ${results.startTime.toLocaleString()}<br>
      <strong>Duration:</strong> ${duration.toFixed(2)} seconds<br>
      <strong>Test Groups:</strong> ${results.passedGroups}/${results.totalGroups} passed<br>
      <strong>Individual Tests:</strong> ${results.passedTests}/${results.totalTests} passed
    </p>
    <div class="progress-bar">
      <div class="progress"></div>
    </div>
  </div>

  <h2>Test Groups</h2>

  ${results.groups
		.map(
			(group) => `
    <div class="group">
      <div class="group-header">
        <h3 class="group-name">${group.name}</h3>
        <span class="group-status ${group.passed ? 'pass' : 'fail'}">
          ${group.passed ? '✅ PASSED' : '❌ FAILED'} (${group.testsPassed}/${group.testsTotal})
        </span>
      </div>
      <div class="group-body">
        <p>${group.description}</p>

        <h4>Tests:</h4>
        ${group.tests
			.map(
				(test) => `
          <div class="test-item">
            <div>
              <strong>${test.name}:</strong>
              <span class="${test.passed ? 'pass' : 'fail'}">${test.passed ? '✅ PASSED' : '❌ FAILED'}</span>
            </div>
            <div>${test.details}</div>
          </div>
        `,
			)
			.join('')}

        <h4>Group Output:</h4>
        <div class="details">${group.details}</div>
      </div>
    </div>
  `,
		)
		.join('')}

  <footer>
    <p class="timestamp">Report generated on ${new Date().toLocaleString()}</p>
  </footer>
</body>
</html>
  `

	// Write HTML to file
	fs.writeFileSync(reportPath, html)
	console.log(`\n📊 Test report generated: ${reportPath}`)

	return reportPath
}

// Main function to run all tests and generate report
async function runAllTests() {
	console.log('🚀 Starting LinkedIn Scraper API Test Suite')
	console.log('==================================================')

	try {
		// Run each test group sequentially
		for (const group of testGroups) {
			const results = await runTestGroup(group)
			testResults.groups.push(results)

			if (results.passed) {
				testResults.passedGroups++
			}
		}

		// Record end time
		testResults.endTime = new Date()

		// Generate HTML report
		const reportPath = generateHtmlReport(testResults)

		// Print summary
		console.log('\n==================================================')
		console.log('🏁 Test Run Complete!')
		console.log(`Test Groups: ${testResults.passedGroups}/${testResults.totalGroups} passed`)
		console.log(`Individual Tests: ${testResults.passedTests}/${testResults.totalTests} passed`)
		console.log(`Duration: ${((testResults.endTime - testResults.startTime) / 1000).toFixed(2)} seconds`)
		console.log('==================================================')

		console.log(`\nView detailed HTML report at: ${reportPath}`)
	} catch (error) {
		console.error('❌ Error running tests:', error)
		process.exit(1)
	}
}

// Run the tests
runAllTests()

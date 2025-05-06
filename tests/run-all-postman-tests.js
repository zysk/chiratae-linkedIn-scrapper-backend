// Run all Postman tests
const { exec, spawn } = require('child_process');
const path = require('path');

console.log('🚀 LinkedIn Scraper API Testing Suite');
console.log('=============================================');

// First, make sure the server is running
console.log('ℹ️ Checking if server is running...');

// Simple check by pinging the health endpoint
exec('curl http://localhost:4001/api/health', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Server is not running! Please start the server with npm run dev');
    process.exit(1);
  }

  try {
    const response = JSON.parse(stdout);
    if (response.status === 'ok') {
      console.log('✅ Server is running!');
      runTests();
    } else {
      console.error('❌ Server is not healthy!');
      process.exit(1);
    }
  } catch (e) {
    console.error('❌ Could not parse server response. Is the server running correctly?');
    process.exit(1);
  }
});

// Function to run a script and capture output
function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    console.log(`🔄 Running script: ${path.basename(scriptPath)}`);

    const childProcess = spawn('node', [scriptPath], { stdio: 'inherit' });

    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script exited with code ${code}`));
      }
    });
  });
}

// Main function to run all tests
async function runTests() {
  try {
    console.log('\n📋 Step 1: Setting up test data');
    console.log('------------------------------------------');
    await runScript(path.join(__dirname, 'setup-postman-test-data.js'));

    console.log('\n📋 Step 2: Running Postman tests');
    console.log('------------------------------------------');
    await runScript(path.join(__dirname, 'run-postman-tests.js'));

    console.log('\n🎉 All tests completed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

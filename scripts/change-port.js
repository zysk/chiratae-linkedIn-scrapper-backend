#!/usr/bin/env node

/**
 * Script to update the PORT in .env file
 * Usage:
 *   node change-port.js [port-number]
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
})

// Get the port from command line arguments or prompt the user
const args = process.argv.slice(2)
let newPort = args[0]

function updateEnvFile(port) {
	const envPath = path.join(__dirname, '..', '.env')
	const envExamplePath = path.join(__dirname, '..', '.env.example')
	let envContent

	// Check if .env file exists
	if (fs.existsSync(envPath)) {
		envContent = fs.readFileSync(envPath, 'utf8')

		// Check if PORT already exists in .env
		if (envContent.includes('PORT=')) {
			// Replace existing PORT value
			envContent = envContent.replace(/PORT=.*/g, `PORT=${port}`)
		} else {
			// Add PORT to .env
			envContent += `\nPORT=${port}`
		}

		// Write updated content back to .env
		fs.writeFileSync(envPath, envContent)
		console.log(`✅ Updated PORT to ${port} in .env file`)
	} else if (fs.existsSync(envExamplePath)) {
		// If .env doesn't exist but .env.example does, create a new .env from .env.example
		envContent = fs.readFileSync(envExamplePath, 'utf8')

		// Check if PORT already exists in .env.example
		if (envContent.includes('PORT=')) {
			// Replace existing PORT value
			envContent = envContent.replace(/PORT=.*/g, `PORT=${port}`)
		} else {
			// Add PORT to .env
			envContent += `\nPORT=${port}`
		}

		// Write new .env file
		fs.writeFileSync(envPath, envContent)
		console.log(`✅ Created .env file with PORT=${port}`)
	} else {
		// If neither .env nor .env.example exists, create a new .env with just the PORT
		fs.writeFileSync(envPath, `PORT=${port}`)
		console.log(`✅ Created new .env file with PORT=${port}`)
	}

	console.log(`🚀 You can now start the server with 'npm start' or 'yarn start'`)
	console.log(`🔗 The server will be available at http://localhost:${port}`)
}

if (newPort) {
	updateEnvFile(newPort)
	rl.close()
} else {
	rl.question('Enter the new port number: ', (port) => {
		if (!port || isNaN(parseInt(port))) {
			console.error('❌ Invalid port number. Please enter a valid number.')
			rl.close()
			return
		}

		updateEnvFile(port)
		rl.close()
	})
}

rl.on('close', () => {
	process.exit(0)
})

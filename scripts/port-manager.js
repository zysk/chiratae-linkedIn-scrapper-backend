#!/usr/bin/env node

/**
 * Port Manager Script
 * A utility to check, change, and configure port settings for the application
 *
 * Usage:
 *   node port-manager.js [command] [options]
 *
 * Commands:
 *   check    - Check if a port is in use
 *   change   - Change the port in .env file
 *   list     - List commonly used ports and their status
 *   find     - Find the next available port
 *
 * Examples:
 *   node port-manager.js check 4000
 *   node port-manager.js change 4001
 *   node port-manager.js list
 *   node port-manager.js find
 */

const fs = require('fs')
const path = require('path')
const net = require('net')
const { exec } = require('child_process')
const readline = require('readline')

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
})

// Common ports to check
const commonPorts = [3000, 4000, 4001, 4002, 4003, 5000, 8000, 8080]

// Check if a port is in use
function isPortInUse(port) {
	return new Promise((resolve) => {
		const server = net.createServer()

		server.once('error', (err) => {
			if (err.code === 'EADDRINUSE') {
				resolve(true) // Port is in use
			} else {
				resolve(false)
			}
		})

		server.once('listening', () => {
			server.close()
			resolve(false) // Port is free
		})

		server.listen(port)
	})
}

// Find next available port starting from base
async function findAvailablePort(basePort = 4000) {
	let port = basePort
	while (await isPortInUse(port)) {
		port++
	}
	return port
}

// Check and display port status
async function checkPort(port) {
	if (!port) {
		console.error('❌ No port specified. Usage: node port-manager.js check [port]')
		process.exit(1)
	}

	const inUse = await isPortInUse(port)

	if (inUse) {
		console.log(`⚠️  Port ${port} is currently in use.`)

		// Find next available port
		const nextPort = await findAvailablePort(parseInt(port) + 1)
		console.log(`✅ Next available port: ${nextPort}`)

		rl.question('Would you like to update your .env file to use this port? (y/n): ', (answer) => {
			if (answer.toLowerCase() === 'y') {
				updateEnvFile(nextPort)
			} else {
				rl.close()
			}
		})
	} else {
		console.log(`✅ Port ${port} is available`)
		rl.close()
	}
}

// List status of common ports
async function listPorts() {
	console.log('Checking common ports...\n')

	for (const port of commonPorts) {
		const inUse = await isPortInUse(port)
		const status = inUse ? '🔴 In use' : '🟢 Available'
		console.log(`Port ${port}: ${status}`)
	}

	rl.close()
}

// Find and suggest an available port
async function findPort() {
	console.log('Finding available port...')

	const port = await findAvailablePort(4000)
	console.log(`✅ Found available port: ${port}`)

	rl.question('Would you like to update your .env file to use this port? (y/n): ', (answer) => {
		if (answer.toLowerCase() === 'y') {
			updateEnvFile(port)
		} else {
			rl.close()
		}
	})
}

// Update PORT in .env file
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

	console.log(`🚀 You can now start the server with 'npm start' or 'npm run dev'`)
	console.log(`🔗 The server will be available at http://localhost:${port}`)
	rl.close()
}

// Main function to handle commands
async function main() {
	const [command, arg] = process.argv.slice(2)

	if (!command) {
		console.log(`
Port Manager - Utility for managing application ports

Usage:
  node port-manager.js [command] [options]

Commands:
  check [port]  - Check if a specific port is in use
  change [port] - Update PORT in .env file
  list          - List status of common ports
  find          - Find next available port

Examples:
  node port-manager.js check 4000
  node port-manager.js change 4001
  node port-manager.js list
  node port-manager.js find
    `)
		process.exit(0)
	}

	switch (command) {
		case 'check':
			await checkPort(arg)
			break
		case 'change':
			if (!arg) {
				console.error('❌ No port specified. Usage: node port-manager.js change [port]')
				process.exit(1)
			}
			updateEnvFile(arg)
			break
		case 'list':
			await listPorts()
			break
		case 'find':
			await findPort()
			break
		default:
			console.error(`❌ Unknown command: ${command}`)
			process.exit(1)
	}
}

// Run the main function
main().catch((err) => {
	console.error('Error:', err)
	process.exit(1)
})

// Close readline interface when process ends
rl.on('close', () => {
	process.exit(0)
})

/**
 * Script to make ChromeDriver files executable on all platforms
 */
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🔄 Making ChromeDriver files executable')
console.log('====================================')

const chromeDriverRootPath = path.join(__dirname, '..', 'chromedriver')

// Function to make a file executable
const makeExecutable = (filePath) => {
	try {
		// On Windows, .exe files are already executable
		// On Unix-like systems, we need to set the permission
		if (process.platform !== 'win32') {
			execSync(`chmod +x "${filePath}"`, { stdio: 'inherit' })
			console.log(`✅ Made executable: ${filePath}`)
		} else {
			// On Windows, we'll just check if the file exists and is accessible
			fs.accessSync(filePath, fs.constants.X_OK)
			console.log(`✅ Confirmed executable: ${filePath}`)
		}
	} catch (err) {
		console.error(`❌ Failed to make executable: ${filePath}`, err.message)
		if (process.platform === 'win32') {
			// On Windows, we can try to use icacls to set execute permission
			try {
				execSync(`icacls "${filePath}" /grant Everyone:RX`, { stdio: 'inherit' })
				console.log(`✅ Set Windows execute permissions: ${filePath}`)
			} catch (winErr) {
				console.error(`❌ Failed to set Windows permissions: ${winErr.message}`)
			}
		}
	}
}

// Process all ChromeDriver directories
const processChromeDrivers = () => {
	// Get all subdirectories in the ChromeDriver root
	const dirs = fs
		.readdirSync(chromeDriverRootPath, { withFileTypes: true })
		.filter((directory) => directory.isDirectory())
		.map((directory) => directory.name)

	console.log(`Found ${dirs.length} ChromeDriver directories: ${dirs.join(', ')}`)

	// Process each directory
	dirs.forEach((dir) => {
		const dirPath = path.join(chromeDriverRootPath, dir)
		console.log(`\nProcessing directory: ${dir}`)

		try {
			// Find all potential ChromeDriver executables
			const files = fs.readdirSync(dirPath)

			// Check for common ChromeDriver executable names
			const executableFiles = files.filter(
				(file) =>
					file === 'chromedriver' || file === 'chromedriver.exe' || (file.includes('chromedriver-') && !file.endsWith('.zip')),
			)

			if (executableFiles.length > 0) {
				console.log(`Found ${executableFiles.length} potential ChromeDriver executables`)
				executableFiles.forEach((file) => {
					makeExecutable(path.join(dirPath, file))
				})
			} else {
				// If no directory executable found, search recursively in subdirectories
				const subDirs = fs
					.readdirSync(dirPath, { withFileTypes: true })
					.filter((directory) => directory.isDirectory())
					.map((directory) => directory.name)

				subDirs.forEach((subDir) => {
					const subDirPath = path.join(dirPath, subDir)
					const subFiles = fs.readdirSync(subDirPath)

					const subExecutables = subFiles.filter(
						(file) =>
							file === 'chromedriver' ||
							file === 'chromedriver.exe' ||
							(file.includes('chromedriver-') && !file.endsWith('.zip')),
					)

					if (subExecutables.length > 0) {
						console.log(`Found ${subExecutables.length} potential ChromeDriver executables in ${subDir}`)
						subExecutables.forEach((file) => {
							makeExecutable(path.join(subDirPath, file))
						})
					}
				})
			}
		} catch (err) {
			console.error(`❌ Error processing directory ${dir}:`, err.message)
		}
	})
}

// Main execution
try {
	if (fs.existsSync(chromeDriverRootPath)) {
		processChromeDrivers()
		console.log('\n🎉 Finished making ChromeDriver files executable!')
	} else {
		console.error(`❌ ChromeDriver root path not found: ${chromeDriverRootPath}`)
		process.exit(1)
	}
} catch (err) {
	console.error('❌ Error:', err.message)
	process.exit(1)
}

/**
 * ChromeDriver Auto-Update Script
 *
 * This script automatically detects the installed Chrome browser version and
 * downloads the matching ChromeDriver version for the current platform.
 *
 * Features:
 * - Auto-detects installed Chrome version on Windows, macOS, and Linux
 * - Falls back to the latest Chrome version if local detection fails
 * - Downloads the appropriate ChromeDriver for the detected version
 * - Handles platform-specific paths and configurations
 * - Creates backups of existing ChromeDriver executables
 * - Cleans up temporary files after installation
 *
 * Usage:
 *   node scripts/update-chromedriver.js
 *
 * No parameters are required - the script auto-detects everything.
 */
const fs = require('fs')
const path = require('path')
const https = require('https')
const { execSync } = require('child_process')
const os = require('os')

console.log('🔄 ChromeDriver Update Script')
console.log('============================')

// Check and install dependencies first
console.log('Checking dependencies...')
try {
	require.resolve('extract-zip')
	console.log('✅ extract-zip already installed')
} catch (err) {
	console.log('Installing extract-zip...')
	execSync('npm install extract-zip --no-save', { stdio: 'inherit' })
	console.log('✅ extract-zip installed')
}

// Ensure axios is installed for HTTP requests
try {
	require.resolve('axios')
	console.log('✅ axios already installed')
} catch (err) {
	console.log('Installing axios...')
	execSync('npm install axios --no-save', { stdio: 'inherit' })
	console.log('✅ axios installed')
}

// Now that we've ensured dependencies are installed, require them
const extract = require('extract-zip')
const axios = require('axios')

// Get platform-specific info
const platform = os.platform()
console.log(`Detected platform: ${platform}`)

/**
 * Detect installed Chrome version based on platform
 */
async function detectChromeVersion() {
	try {
		let chromeVersion

		if (platform === 'win32') {
			try {
				// Try using registry query
				const output = execSync(
					'reg query "HKLM\\SOFTWARE\\Wow6432Node\\Google\\Chrome\\BLBeacon" /v version || ' +
						'reg query "HKLM\\SOFTWARE\\Google\\Chrome\\BLBeacon" /v version',
				).toString()
				const match = output.match(/version\s+REG_SZ\s+([\d.]+)/i)
				if (match && match[1]) {
					chromeVersion = match[1]
				}
			} catch (err) {
				console.log('Unable to detect Chrome version from registry, trying executable path...')
				try {
					// Fallback to checking Chrome executable version
					const output = execSync(
						"powershell -command \"$v1 = (Get-Item 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' -ErrorAction SilentlyContinue).VersionInfo.FileVersion; $v2 = (Get-Item 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe' -ErrorAction SilentlyContinue).VersionInfo.FileVersion; if($v1){$v1}elseif($v2){$v2}\"",
					)
						.toString()
						.trim()
					if (output) {
						chromeVersion = output.split('.').slice(0, 3).join('.')
					}
				} catch (versionErr) {
					console.log('Unable to detect Chrome version from executable.')

					// Additional fallback to search for Chrome in user directory
					try {
						console.log('Trying to find Chrome in user AppData directory...')
						const userProfile = process.env.USERPROFILE || 'C:\\Users\\Default'
						const command = `powershell -command "$path = Join-Path -Path '${userProfile}' -ChildPath 'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'; if (Test-Path $path) { (Get-Item $path).VersionInfo.FileVersion }"`
						const output = execSync(command).toString().trim()
						if (output) {
							chromeVersion = output.split('.').slice(0, 3).join('.')
							console.log(`Found Chrome in user directory, version: ${chromeVersion}`)
						}
					} catch (userDirErr) {
						console.log('Unable to find Chrome in user directory.')
					}
				}
			}
		} else if (platform === 'darwin') {
			try {
				// macOS - check Chrome app version
				const output = execSync(
					'/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --version || ' +
						'defaults read /Applications/Google\\ Chrome.app/Contents/Info.plist KSVersion || ' +
						'defaults read /Applications/Google\\ Chrome.app/Contents/Info.plist CFBundleShortVersionString',
				).toString()
				const match = output.match(/Chrome\s+([\d.]+)/i) || output.match(/([\d.]+)/)
				if (match && match[1]) {
					chromeVersion = match[1]
				}
			} catch (err) {
				console.log('Unable to detect Chrome version on macOS.')
			}
		} else {
			// Linux
			try {
				const output = execSync('google-chrome --version || google-chrome-stable --version').toString()
				const match = output.match(/Chrome\s+([\d.]+)/i)
				if (match && match[1]) {
					chromeVersion = match[1]
				}
			} catch (err) {
				console.log('Unable to detect Chrome version on Linux.')
			}
		}

		if (!chromeVersion) {
			console.log('Could not detect Chrome version. Using fallback method...')
			// Fetch the latest Chrome version from the Chrome for Testing API
			const response = await axios.get(
				'https://googlechromelabs.github.io/chrome-for-testing/known-good-versions-with-downloads.json',
			)
			const latestVersionInfo = response.data.versions.slice(-1)[0]
			chromeVersion = latestVersionInfo.version
			console.log(`Using latest known Chrome version: ${chromeVersion}`)
		} else {
			console.log(`Detected Chrome version: ${chromeVersion}`)
		}

		return chromeVersion
	} catch (error) {
		console.error('Error detecting Chrome version:', error.message)
		throw error
	}
}

/**
 * Find the matching ChromeDriver version for a given Chrome version
 */
async function findMatchingChromeDriverVersion(chromeVersion) {
	try {
		// Get the major version to match ChromeDriver
		const majorVersion = chromeVersion.split('.')[0]
		console.log(`Chrome major version: ${majorVersion}`)

		// Fetch the known good versions from Chrome for Testing API
		const response = await axios.get('https://googlechromelabs.github.io/chrome-for-testing/known-good-versions-with-downloads.json')
		const versions = response.data.versions

		// Filter versions that match the major version and have chromedriver downloads
		const matchingVersions = versions.filter((v) => v.version.startsWith(`${majorVersion}.`) && v.downloads && v.downloads.chromedriver)

		if (matchingVersions.length === 0) {
			throw new Error(`No matching ChromeDriver version found for Chrome ${chromeVersion}`)
		}

		// Get the latest matching version
		const latestMatchingVersion = matchingVersions[matchingVersions.length - 1]
		console.log(`Found matching ChromeDriver version: ${latestMatchingVersion.version}`)

		return {
			version: latestMatchingVersion.version,
			downloadUrls: {
				win32: latestMatchingVersion.downloads.chromedriver.find((d) => d.platform === 'win32')?.url,
				win64: latestMatchingVersion.downloads.chromedriver.find((d) => d.platform === 'win64')?.url,
				mac64: latestMatchingVersion.downloads.chromedriver.find((d) => d.platform === 'mac-x64')?.url,
				mac_arm64: latestMatchingVersion.downloads.chromedriver.find((d) => d.platform === 'mac-arm64')?.url,
				linux64: latestMatchingVersion.downloads.chromedriver.find((d) => d.platform === 'linux64')?.url,
			},
		}
	} catch (error) {
		console.error('Error finding matching ChromeDriver version:', error.message)
		throw error
	}
}

// Platform-specific selection function
function getPlatformUrl(downloadUrls) {
	if (platform === 'win32') {
		// Prefer win64 but fall back to win32
		return downloadUrls.win64 || downloadUrls.win32
	} else if (platform === 'darwin') {
		// Check if on Apple Silicon or Intel
		const arch = os.arch()
		return arch === 'arm64' ? downloadUrls.mac_arm64 : downloadUrls.mac64
	} else {
		// Linux
		return downloadUrls.linux64
	}
}

// Platform-specific target path
function getTargetPath() {
	const baseDriverPath = path.join(__dirname, '..', 'chromedriver')

	if (platform === 'win32') {
		return path.join(baseDriverPath, 'chromedriver-win32')
	} else if (platform === 'darwin') {
		return path.join(baseDriverPath, 'chromedriver-mac')
	} else {
		return path.join(baseDriverPath, 'chromedriver-linux64')
	}
}

// Extract platform-specific folder name from URL
function getExtractedFolderName(url) {
	if (url.includes('win32')) return 'chromedriver-win32'
	if (url.includes('win64')) return 'chromedriver-win64'
	if (url.includes('mac-x64')) return 'chromedriver-mac-x64'
	if (url.includes('mac-arm64')) return 'chromedriver-mac-arm64'
	if (url.includes('linux64')) return 'chromedriver-linux64'

	// Default fallback based on platform
	if (platform === 'win32') return 'chromedriver-win64'
	if (platform === 'darwin') return 'chromedriver-mac-x64'
	return 'chromedriver-linux64'
}

// Download ChromeDriver
const downloadChromeDriver = (url, downloadPath) => {
	return new Promise((resolve, reject) => {
		console.log(`Downloading from: ${url}`)
		const file = fs.createWriteStream(downloadPath)
		https
			.get(url, (response) => {
				if (response.statusCode !== 200) {
					reject(new Error(`Failed to download ChromeDriver: ${response.statusCode} ${response.statusMessage}`))
					return
				}

				response.pipe(file)
				file.on('finish', () => {
					file.close()
					console.log('✅ Download completed')
					resolve()
				})
			})
			.on('error', (err) => {
				fs.unlink(downloadPath, () => {})
				reject(err)
			})
	})
}

// Extract ZIP file
const extractChromeDriver = async (downloadPath, extractPath) => {
	console.log('Extracting ChromeDriver...')

	// Create extract directory if it doesn't exist
	if (!fs.existsSync(extractPath)) {
		fs.mkdirSync(extractPath, { recursive: true })
	}

	try {
		await extract(downloadPath, { dir: extractPath })
		console.log('✅ Extraction completed')
	} catch (err) {
		throw new Error(`Failed to extract ChromeDriver: ${err.message}`)
	}
}

// Replace existing ChromeDriver
const replaceChromeDriver = (extractPath, extractedFolderName, targetPath) => {
	console.log('Replacing existing ChromeDriver...')

	// Create target directory if it doesn't exist
	if (!fs.existsSync(targetPath)) {
		fs.mkdirSync(targetPath, { recursive: true })
		console.log(`Created target directory: ${targetPath}`)
	}

	// Determine executable name based on platform
	const executableName = platform === 'win32' ? 'chromedriver.exe' : 'chromedriver'
	const executablePath = path.join(targetPath, executableName)

	// Backup existing executable if it exists
	if (fs.existsSync(executablePath)) {
		const backupPath = path.join(targetPath, `${executableName}.backup`)
		fs.copyFileSync(executablePath, backupPath)
		console.log(`✅ Backup created at ${backupPath}`)
	}

	// Copy new files
	let sourceFolder = path.join(extractPath, extractedFolderName)

	// Check if the folder exists
	if (!fs.existsSync(sourceFolder)) {
		// Try to find another folder at the extract path
		const extractFolders = fs
			.readdirSync(extractPath, { withFileTypes: true })
			.filter((dirent) => dirent.isDirectory())
			.map((dirent) => dirent.name)

		if (extractFolders.length > 0) {
			console.log(`Using alternative extracted folder: ${extractFolders[0]}`)
			sourceFolder = path.join(extractPath, extractFolders[0])
		} else {
			throw new Error(`Extracted folder not found: ${extractedFolderName}`)
		}
	}

	const sourceFiles = fs.readdirSync(sourceFolder)
	sourceFiles.forEach((file) => {
		const sourcePath = path.join(sourceFolder, file)
		const targetFilePath = path.join(targetPath, file)
		fs.copyFileSync(sourcePath, targetFilePath)
		console.log(`Copied: ${file}`)

		// Make executable on non-Windows platforms
		if (platform !== 'win32' && file === 'chromedriver') {
			try {
				execSync(`chmod +x "${targetFilePath}"`)
				console.log(`Made executable: ${targetFilePath}`)
			} catch (err) {
				console.warn(`⚠️ Warning: Failed to make executable: ${err.message}`)
			}
		}
	})

	console.log('✅ ChromeDriver replaced successfully')
}

// Clean up temporary files
const cleanup = (downloadPath, extractPath) => {
	console.log('Cleaning up temporary files...')

	try {
		if (fs.existsSync(downloadPath)) {
			fs.unlinkSync(downloadPath)
		}

		if (fs.existsSync(extractPath)) {
			fs.rmSync(extractPath, { recursive: true, force: true })
		}

		console.log('✅ Cleanup completed')
	} catch (err) {
		console.warn(`⚠️ Warning during cleanup: ${err.message}`)
	}
}

// Main function
const main = async () => {
	let downloadPath
	let extractPath

	try {
		// 1. Detect Chrome version
		const chromeVersion = await detectChromeVersion()

		// 2. Find matching ChromeDriver version
		const chromeDriverInfo = await findMatchingChromeDriverVersion(chromeVersion)
		console.log(`Using ChromeDriver version: ${chromeDriverInfo.version}`)

		// 3. Get platform-specific download URL
		const downloadUrl = getPlatformUrl(chromeDriverInfo.downloadUrls)
		if (!downloadUrl) {
			throw new Error(`No ChromeDriver download URL found for platform: ${platform}`)
		}

		// 4. Set paths
		downloadPath = path.join(__dirname, `chromedriver-${platform}-${chromeDriverInfo.version}.zip`)
		extractPath = path.join(__dirname, `chromedriver-${platform}-extracted-${chromeDriverInfo.version}`)
		const targetPath = getTargetPath()
		const extractedFolderName = getExtractedFolderName(downloadUrl)

		console.log(`Download URL: ${downloadUrl}`)
		console.log(`Target path: ${targetPath}`)

		// 5. Download ChromeDriver
		await downloadChromeDriver(downloadUrl, downloadPath)

		// 6. Extract the archive
		await extractChromeDriver(downloadPath, extractPath)

		// 7. Replace existing ChromeDriver
		replaceChromeDriver(extractPath, extractedFolderName, targetPath)

		// 8. Cleanup
		cleanup(downloadPath, extractPath)

		console.log('🎉 ChromeDriver update completed successfully!')
		console.log(`ChromeDriver version ${chromeDriverInfo.version} is now installed for ${platform}`)
	} catch (err) {
		console.error(`❌ Error: ${err.message}`)
		if (downloadPath && extractPath) {
			cleanup(downloadPath, extractPath)
		}
		process.exit(1)
	}
}

main()

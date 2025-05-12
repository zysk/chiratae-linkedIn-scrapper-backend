const mongoose = require('mongoose')
const { CONFIG } = require('../dist/utils/config')
const LinkedInAccount = require('../dist/models/linkedinAccount.model').default
const { encrypt } = require('../dist/utils/encryption.utils')

async function reencryptPasswords() {
	try {
		// Connect to MongoDB
		await mongoose.connect(CONFIG.MONGOURI)
		console.log('Connected to MongoDB')

		// Get all LinkedIn accounts
		const accounts = await LinkedInAccount.find({})
		console.log(`Found ${accounts.length} LinkedIn accounts`)

		// Re-encrypt passwords for each account
		for (const account of accounts) {
			try {
				// Set the password again to trigger re-encryption
				account.setPassword(account.getPassword())
				await account.save()
				console.log(`✅ Re-encrypted password for account: ${account.username}`)
			} catch (error) {
				console.error(`❌ Error re-encrypting password for account: ${account.username}`, error)
			}
		}

		console.log('Password re-encryption completed')
	} catch (error) {
		console.error('Error:', error)
	} finally {
		await mongoose.disconnect()
	}
}

// Run the script
reencryptPasswords()

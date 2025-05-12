// Setup test data for Postman tests
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
require('dotenv').config()

// MongoDB connection
const connectDB = async () => {
	try {
		console.log('Connecting to MongoDB...')
		const MONGOURI = process.env.MONGOURI || 'mongodb://localhost:27017/linkedin-scraper'
		await mongoose.connect(MONGOURI)
		console.log('✅ MongoDB connected!')
	} catch (err) {
		console.error('❌ MongoDB connection error:', err.message)
		process.exit(1)
	}
}

// Define schema for User
const UserSchema = new mongoose.Schema(
	{
		name: String,
		email: String,
		password: String,
		phone: Number,
		isActive: { type: Boolean, default: true },
		role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
	},
	{ timestamps: true },
)

// Define schema for LinkedIn Account
const LinkedInAccountSchema = new mongoose.Schema(
	{
		username: String,
		encryptedPassword: String,
		email: String,
		description: String,
		isActive: { type: Boolean, default: true },
		lastUsed: { type: Date },
		usageCount: { type: Number, default: 0 },
		createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	},
	{ timestamps: true },
)

// Define schema for Proxy
const ProxySchema = new mongoose.Schema(
	{
		host: String,
		port: Number,
		username: String,
		encryptedPassword: String,
		protocol: String,
		description: String,
		isActive: { type: Boolean, default: true },
		lastUsed: { type: Date },
		usageCount: { type: Number, default: 0 },
		createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	},
	{ timestamps: true },
)

// Create models
const User = mongoose.model('User', UserSchema)
const LinkedInAccount = mongoose.model('LinkedInAccount', LinkedInAccountSchema)
const Proxy = mongoose.model('Proxy', ProxySchema)

// Encrypt password for LinkedIn account
const encryptLinkedInPassword = (password) => {
	const algorithm = 'aes-256-ctr'
	const secretKey = process.env.ENCRYPTION_KEY || 'linkedInScraperSecretKey'
	const key = crypto.scryptSync(secretKey, 'salt', 32)
	const iv = Buffer.alloc(16, 0)

	const cipher = crypto.createCipheriv(algorithm, key, iv)
	const encrypted = Buffer.concat([cipher.update(password), cipher.final()])
	return encrypted.toString('hex')
}

// Function to create an admin user
const createAdminUser = async () => {
	try {
		// Check if admin already exists
		const existingAdmin = await User.findOne({ email: 'admin@example.com' })
		if (existingAdmin) {
			console.log('ℹ️ Admin user already exists, skipping creation')
			return existingAdmin
		}

		// Hash password
		const salt = await bcrypt.genSalt(10)
		const hashedPassword = await bcrypt.hash('adminpass123', salt)

		// Create admin user
		const admin = new User({
			name: 'Admin User',
			email: 'admin@example.com',
			password: hashedPassword,
			phone: 9876543210,
			isActive: true,
			role: 'ADMIN',
		})

		await admin.save()
		console.log('✅ Admin user created successfully')
		return admin
	} catch (err) {
		console.error('❌ Error creating admin user:', err.message)
		throw err
	}
}

// Function to create a regular user
const createRegularUser = async () => {
	try {
		// Check if user already exists
		const existingUser = await User.findOne({ email: 'testuser@example.com' })
		if (existingUser) {
			console.log('ℹ️ Regular user already exists, skipping creation')
			return existingUser
		}

		// Hash password
		const salt = await bcrypt.genSalt(10)
		const hashedPassword = await bcrypt.hash('password123', salt)

		// Create regular user
		const user = new User({
			name: 'Test User',
			email: 'testuser@example.com',
			password: hashedPassword,
			phone: 1234567890,
			isActive: true,
			role: 'USER',
		})

		await user.save()
		console.log('✅ Regular user created successfully')
		return user
	} catch (err) {
		console.error('❌ Error creating regular user:', err.message)
		throw err
	}
}

// Function to create a LinkedIn account
const createLinkedInAccount = async (adminId) => {
	try {
		// Check if account already exists
		const existingAccount = await LinkedInAccount.findOne({ email: 'linkedin_test@example.com' })
		if (existingAccount) {
			console.log('ℹ️ LinkedIn account already exists, skipping creation')
			return existingAccount
		}

		// Create LinkedIn account
		const account = new LinkedInAccount({
			username: 'linkedin_test',
			encryptedPassword: encryptLinkedInPassword('securePassword123'),
			email: 'linkedin_test@example.com',
			description: 'Test LinkedIn account',
			isActive: true,
			createdBy: adminId,
		})

		await account.save()
		console.log('✅ LinkedIn account created successfully')
		return account
	} catch (err) {
		console.error('❌ Error creating LinkedIn account:', err.message)
		throw err
	}
}

// Function to create a proxy
const createProxy = async (adminId) => {
	try {
		// Check if proxy already exists
		const existingProxy = await Proxy.findOne({ host: '192.168.1.100' })
		if (existingProxy) {
			console.log('ℹ️ Proxy already exists, skipping creation')
			return existingProxy
		}

		// Create proxy
		const proxy = new Proxy({
			host: '192.168.1.100',
			port: 8080,
			username: 'proxyuser',
			encryptedPassword: encryptLinkedInPassword('proxypass'),
			protocol: 'http',
			description: 'Test proxy server',
			isActive: true,
			createdBy: adminId,
		})

		await proxy.save()
		console.log('✅ Proxy created successfully')
		return proxy
	} catch (err) {
		console.error('❌ Error creating proxy:', err.message)
		throw err
	}
}

// Main function to set up test data
const setupTestData = async () => {
	try {
		await connectDB()

		// Create users
		const admin = await createAdminUser()
		const user = await createRegularUser()

		// Create LinkedIn account and proxy
		if (admin) {
			await createLinkedInAccount(admin._id)
			await createProxy(admin._id)
		}

		console.log('✅ Test data setup completed successfully')
		process.exit(0)
	} catch (err) {
		console.error('❌ Error in test data setup:', err.message)
		process.exit(1)
	}
}

// Run the setup function
setupTestData()

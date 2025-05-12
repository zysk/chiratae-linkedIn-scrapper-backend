const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config()

// Get MongoDB URI from environment
const MONGODB_URI = process.env.MONGOURI || 'mongodb://root:Root123@localhost:27017/linkedin-scrapper?authSource=admin'

async function main() {
	console.log('Connecting to MongoDB...')

	try {
		await mongoose.connect(MONGODB_URI)
		console.log('Connected to MongoDB!')

		// Define user schema
		const userSchema = new mongoose.Schema(
			{
				name: String,
				email: { type: String, required: true, unique: true },
				password: { type: String, required: true },
				isActive: { type: Boolean, default: true },
				role: { type: String, enum: ['USER', 'ADMIN', 'CLIENT'], default: 'ADMIN' },
				searchCompleted: { type: Boolean, default: false },
				phone: Number,
				educationArr: { type: Array, default: [] },
				experienceArr: { type: Array, default: [] },
				contactInfoArr: { type: Array, default: [] },
			},
			{
				collection: 'users',
				timestamps: true,
			},
		)

		const User = mongoose.model('User', userSchema)

		// Hash password
		const salt = await bcrypt.genSalt(10)
		const hashedPassword = await bcrypt.hash('adminpass123', salt)

		// Create admin user
		const adminData = {
			name: 'Admin Test User',
			email: 'admin2@example.com',
			password: hashedPassword,
			role: 'ADMIN',
			phone: 9998887777,
		}

		// Try to find if user already exists
		const existingUser = await User.findOne({ email: adminData.email })

		if (existingUser) {
			console.log('User already exists, updating password...')
			existingUser.password = hashedPassword
			existingUser.role = 'ADMIN' // Ensure the role is ADMIN
			await existingUser.save()
			console.log('Updated user:', existingUser.email)
		} else {
			// Create new user
			const newUser = new User(adminData)
			await newUser.save()
			console.log('Created new admin user:', newUser.email)
		}

		// Verify admin users
		const adminUsers = await User.find({ role: 'ADMIN' }).select('-password')
		console.log('\nAdmin users in the database:')
		console.log(JSON.stringify(adminUsers, null, 2))
	} catch (error) {
		console.error('Error:', error)
	} finally {
		await mongoose.disconnect()
		console.log('Disconnected from MongoDB')
	}
}

main().catch(console.error)

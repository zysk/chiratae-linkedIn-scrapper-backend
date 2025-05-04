import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Get encryption key from environment variables or use a default for development (not recommended for production)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-for-development-only';
const ENCRYPTION_IV = process.env.ENCRYPTION_IV || 'default-iv-16-chars';
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';

/**
 * Encrypts a string using AES-256-CBC algorithm
 * @param text - Plain text to encrypt
 * @returns Encrypted text in hex format
 */
export const encrypt = (text: string): string => {
  try {
    // Initialize cipher
    const iv = Buffer.from(ENCRYPTION_IV, 'utf8').slice(0, 16);
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

    // Encrypt and convert to hex
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypts a string that was encrypted using the encrypt function
 * @param encryptedText - Encrypted text in hex format
 * @returns Decrypted plain text
 */
export const decrypt = (encryptedText: string): string => {
  try {
    // Initialize decipher
    const iv = Buffer.from(ENCRYPTION_IV, 'utf8').slice(0, 16);
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);

    // Decrypt
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Test if encryption and decryption are working correctly
 * @param text - Text to test encryption/decryption with
 * @returns true if the test passes (decrypted text matches original), false otherwise
 */
export const testEncryptionDecryption = (text: string): boolean => {
  try {
    const encrypted = encrypt(text);
    const decrypted = decrypt(encrypted);
    return decrypted === text;
  } catch (error) {
    return false;
  }
};

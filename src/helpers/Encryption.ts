/**
 * Encryption/decryption utilities for sensitive data.
 */

import crypto from "crypto";
import { config } from "../config/config";
import Logger from "./Logger";

const logger = new Logger({ context: "encryption" });

// For strong encryption, we need a secure key, IV, and algorithm
// In production, the encryption key should be stored securely, not in code
const ENCRYPTION_KEY =
  config.ENCRYPTION_KEY || "mySecretEncryptionKey32CharsLong!";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;

/**
 * Encrypts a string (like a password) using AES-256-GCM
 * Returns the encrypted string, IV, and auth tag as a colon-separated string
 */
export const encryptPassword = async (text: string): Promise<string> => {
  try {
    if (!text) return "";

    // Generate a random initialization vector
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);

    // Create a cipher using our encryption key and IV
    const key = crypto.scryptSync(ENCRYPTION_KEY, salt, 32);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt the text
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Get the authentication tag
    const authTag = cipher.getAuthTag();

    // Return everything needed for decryption as a single string
    // Format: salt:iv:authTag:encryptedText
    return Buffer.from(
      salt.toString("hex") +
        ":" +
        iv.toString("hex") +
        ":" +
        authTag.toString("hex") +
        ":" +
        encrypted,
    ).toString("base64");
  } catch (error) {
    logger.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
};

/**
 * Decrypts an encrypted string
 * Expects the format: salt:iv:authTag:encryptedText (base64 encoded)
 */
export const decryptPassword = async (
  encryptedData: string,
): Promise<string | null> => {
  try {
    if (!encryptedData) return null;

    // Decode the base64 string
    const encryptedBuffer = Buffer.from(encryptedData, "base64").toString();

    // Split into components
    const [saltHex, ivHex, authTagHex, encrypted] = encryptedBuffer.split(":");

    if (!saltHex || !ivHex || !authTagHex || !encrypted) {
      logger.error("Invalid encrypted data format");
      return null;
    }

    // Convert hex strings back to Buffers
    const salt = Buffer.from(saltHex, "hex");
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    // Recreate the key
    const key = crypto.scryptSync(ENCRYPTION_KEY, salt, 32);

    // Create a decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt the text
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    logger.error("Decryption error:", error);
    return null;
  }
};

/**
 * Simple function to check if a string looks like it's already encrypted
 * using our format (base64 encoded string with expected components)
 */
export const isEncrypted = (text: string): boolean => {
  try {
    if (!text) return false;

    // Check if the string is base64 encoded
    const decoded = Buffer.from(text, "base64").toString();

    // Check if the decoded string has the expected format (salt:iv:authTag:encrypted)
    const parts = decoded.split(":");
    return parts.length === 4;
  } catch (error) {
    // If there's an error decoding, it's not a valid base64 string
    return false;
  }
};

export default {
  encryptPassword,
  decryptPassword,
  isEncrypted,
};

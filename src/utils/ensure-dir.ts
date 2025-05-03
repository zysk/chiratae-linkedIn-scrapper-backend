import fs from "fs";
import path from "path";

/**
 * Ensures that a directory exists, creating it if necessary
 * @param dirPath The directory path to ensure
 */
export function ensureDirectoryExists(dirPath: string): void {
  // Resolve the directory path
  const resolvedPath = path.resolve(dirPath);

  // Check if directory already exists
  if (fs.existsSync(resolvedPath)) {
    const stats = fs.statSync(resolvedPath);
    if (stats.isDirectory()) {
      return; // Directory already exists
    }
    throw new Error(`Path exists but is not a directory: ${resolvedPath}`);
  }

  try {
    // Create directory with recursive option to create parent directories if needed
    fs.mkdirSync(resolvedPath, { recursive: true });
    console.log(`Created directory: ${resolvedPath}`);
  } catch (error) {
    console.error(`Error creating directory ${resolvedPath}:`, error);
    throw error;
  }
}

/**
 * Ensures that the logs directory exists for the application
 */
export function ensureLogsDirectory(): void {
  ensureDirectoryExists(path.resolve(process.cwd(), "logs"));
}

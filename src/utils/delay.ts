/**
 * Utility for adding delays to actions to mimic human behavior
 * and reduce bot detection in web scraping/automation tasks
 */

import { WebElement } from 'selenium-webdriver';

/**
 * Sleep for a specified number of milliseconds
 *
 * @param ms The number of milliseconds to sleep
 * @returns A promise that resolves after the specified time
 */
export const sleep = (ms: number): Promise<void> => {
	return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Sleep for a random amount of time between min and max milliseconds
 * This helps mimic human behavior by adding unpredictable delays
 *
 * @param minMs The minimum number of milliseconds to sleep
 * @param maxMs The maximum number of milliseconds to sleep
 * @returns A promise that resolves after a random time between minMs and maxMs
 */
export const randomDelay = async (minMs: number = 1000, maxMs: number = 3000): Promise<void> => {
	// Ensure valid range
	if (minMs < 0) minMs = 0;
	if (maxMs < minMs) maxMs = minMs;

	// Calculate a random delay within the range
	const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;

	// Sleep for the calculated time
	return sleep(delay);
};

/**
 * Add a typing delay with random variations to mimic human typing
 *
 * @param text The text to type (used to calculate realistic typing speed)
 * @param wpm Words per minute typing speed (default: 30-70 WPM range)
 * @returns The delay in milliseconds
 */
export const typingDelay = (text: string, wpm?: number): number => {
	// Default to a random typing speed between 30-70 WPM if not specified
	const wordsPerMinute = wpm || Math.floor(Math.random() * 41) + 30;

	// Calculate typing time - average word is 5 characters
	const numWords = text.length / 5;

	// Convert WPM to characters per millisecond
	const cpm = wordsPerMinute * 5;  // characters per minute
	const cps = cpm / 60;            // characters per second
	const cpms = cps / 1000;         // characters per millisecond

	// Calculate ideal time to type the text
	let baseTime = Math.round(text.length / cpms);

	// Add some randomness (±15%)
	const variance = baseTime * 0.15;
	baseTime += Math.floor(Math.random() * variance * 2) - variance;

	return Math.max(baseTime, 100);  // Ensure at least 100ms
};

/**
 * Staggered typing function that adds natural timing between keystrokes
 *
 * @param element A function to get the web element to type into
 * @param text The text to type
 * @param getElementFn Function to get the element (used to handle stale elements)
 */
export const humanTypeText = async (
	element: WebElement | (() => Promise<WebElement>),
	text: string
): Promise<void> => {
	try {
		// Get the element
		const inputElement = typeof element === 'function' ? await element() : element;

		// Clear the field first
		await inputElement.clear();
		await randomDelay(100, 300);

		// Type characters one by one with random delays
		for (const char of text) {
			await inputElement.sendKeys(char);
			await randomDelay(50, 150);
		}
	} catch (error) {
		throw new Error(`Error typing text "${text}": ${error instanceof Error ? error.message : String(error)}`);
	}
};

/**
 * Simulate human-like scrolling on a page
 * @param driver WebDriver instance
 * @param distance Scroll distance in pixels (positive for down, negative for up)
 * @param steps Number of steps to break the scroll into (higher = smoother)
 * @returns Promise that resolves when scrolling is complete
 */
export async function smoothScroll(
	driver: any,
	distance: number,
	steps = 10
): Promise<void> {
	try {
		const scrollPerStep = Math.floor(distance / steps);

		for (let i = 0; i < steps; i++) {
			await driver.executeScript(`window.scrollBy(0, ${scrollPerStep});`);
			await randomDelay(50, 100);
		}
	} catch (error) {
		throw new Error(`Error scrolling: ${error instanceof Error ? error.message : String(error)}`);
	}
}

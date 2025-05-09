/**
 * Utility functions for LinkedIn data extraction and manipulation
 */

/**
 * Extracts the LinkedIn profile ID from a profile URL
 *
 * @param url LinkedIn profile URL
 * @returns The extracted profile ID or empty string if not found
 */
export const extractProfileId = (url: string): string => {
  if (!url) return '';

  try {
    // Extract the ID from the URL
    // URL formats:
    // - https://www.linkedin.com/in/username/
    // - https://www.linkedin.com/in/username-12345/
    // - https://www.linkedin.com/in/username-12345a6b7/

    // Remove any query parameters or hashes
    const cleanUrl = url.split('?')[0].split('#')[0];

    // Extract the path part after '/in/'
    const match = cleanUrl.match(/\/in\/([^/]+)/);

    if (match && match[1]) {
      return match[1];
    }

    return '';
  } catch (error) {
    console.error('Error extracting profile ID:', error);
    return '';
  }
};

/**
 * Extracts the company name from a LinkedIn company URL
 *
 * @param url LinkedIn company URL
 * @returns The extracted company name or empty string if not found
 */
export const extractCompanyFromUrl = (url: string): string => {
  if (!url) return '';

  try {
    // Extract the company name from the URL
    // URL formats:
    // - https://www.linkedin.com/company/company-name/
    // - https://www.linkedin.com/company/123456/

    // Remove any query parameters or hashes
    const cleanUrl = url.split('?')[0].split('#')[0];

    // Extract the path part after '/company/'
    const match = cleanUrl.match(/\/company\/([^/]+)/);

    if (match && match[1]) {
      // For numeric IDs, we can't determine the name from the URL
      if (/^\d+$/.test(match[1])) {
        return '';
      }

      // Replace hyphens with spaces and capitalize words
      return match[1]
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
    }

    return '';
  } catch (error) {
    console.error('Error extracting company from URL:', error);
    return '';
  }
};

/**
 * Normalizes a LinkedIn URL to a standard format
 *
 * @param url LinkedIn URL
 * @returns Normalized URL
 */
export const normalizeLinkedInUrl = (url: string): string => {
  if (!url) return '';

  try {
    // Standardize LinkedIn URLs to www.linkedin.com format
    let normalizedUrl = url.trim();

    // Add https:// if missing
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    // Replace country-specific domains with www
    normalizedUrl = normalizedUrl.replace(/https:\/\/([a-z]{2,3})\.linkedin\.com/i, 'https://www.linkedin.com');

    // Remove trailing slash if present
    normalizedUrl = normalizedUrl.replace(/\/$/, '');

    // Remove query parameters and fragments
    normalizedUrl = normalizedUrl.split('?')[0].split('#')[0];

    return normalizedUrl;
  } catch (error) {
    console.error('Error normalizing LinkedIn URL:', error);
    return url;
  }
};

/**
 * Parses a company size text into a standardized format
 *
 * @param sizeText Text containing company size information
 * @returns Normalized company size or undefined if parsing fails
 */
export const tryParseCompanySize = (sizeText?: string): string | undefined => {
  if (!sizeText) return undefined;

  try {
    // Various formats of company size on LinkedIn:
    // - "1-10 employees"
    // - "11-50 employees"
    // - "51-200 employees"
    // - "201-500 employees"
    // - "501-1,000 employees"
    // - "1,001-5,000 employees"
    // - "5,001-10,000 employees"
    // - "10,001+ employees"

    // Clean the text and extract the size range
    const cleanText = sizeText.trim().toLowerCase();
    const match = cleanText.match(/(\d+(?:,\d+)?(?:-\d+(?:,\d+)?|\+))\s*employees/);

    if (match && match[1]) {
      return match[1].replace(/,/g, '');
    }

    return undefined;
  } catch (error) {
    console.error('Error parsing company size:', error);
    return undefined;
  }
};

/**
 * Extracts a clean name from a full LinkedIn name (removes credentials and designations)
 *
 * @param fullName Full name from LinkedIn
 * @returns Clean name without credentials
 */
export const extractCleanName = (fullName: string): string => {
  if (!fullName) return '';

  try {
    // Remove common LinkedIn credentials and designations
    return fullName
      .replace(/,\s*(MBA|PhD|MD|JD|CPA|PE|PMP|CISSP|CFA|CFP|CISA|MCSE|CCNA|CCNP|CSM|PgMP|PMI-ACP|PMI-RMP)(\s*,\s*|\s*$|\s*[,.])/gi, '')
      .replace(/\([^)]*\)/g, '') // Remove text in parentheses
      .replace(/\s+/g, ' ')     // Normalize whitespace
      .trim();
  } catch (error) {
    console.error('Error cleaning name:', error);
    return fullName;
  }
};

/**
 * Determines if a profile URL belongs to a standard user profile
 *
 * @param url LinkedIn profile URL
 * @returns True if it's a standard user profile
 */
export const isUserProfile = (url: string): boolean => {
  if (!url) return false;

  try {
    return url.includes('/in/') && !url.includes('/company/') && !url.includes('/school/');
  } catch (error) {
    console.error('Error checking if profile is user:', error);
    return false;
  }
};

/**
 * Extracts the industry from a full text containing industry information
 *
 * @param industryText Full text with industry information
 * @returns Clean industry name or undefined if not found
 */
export const extractIndustry = (industryText?: string): string | undefined => {
  if (!industryText) return undefined;

  try {
    // Clean up the industry text
    const cleanText = industryText.trim();

    // Common formats:
    // - "Industry: Software Development"
    // - "Software Development"

    const industryMatch = cleanText.match(/Industry:\s*(.+)/i);

    if (industryMatch && industryMatch[1]) {
      return industryMatch[1].trim();
    }

    return cleanText;
  } catch (error) {
    console.error('Error extracting industry:', error);
    return undefined;
  }
};

/**
 * Constructs a LinkedIn profile URL from a profile ID (clientId)
 *
 * @param clientId LinkedIn profile ID
 * @returns Constructed LinkedIn profile URL
 */
export const constructProfileUrl = (clientId: string): string => {
  if (!clientId) return '';

  try {
    // Clean the clientId
    const cleanId = clientId.trim();

    // Construct the profile URL
    return `https://www.linkedin.com/in/${cleanId}/`;
  } catch (error) {
    console.error('Error constructing profile URL:', error);
    return '';
  }
};

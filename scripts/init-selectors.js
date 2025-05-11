#!/usr/bin/env node

/**
 * Initialize the selector system
 *
 * This script creates the default selector configuration file if it doesn't exist.
 * It helps bootstrap the selector system with known working selectors.
 *
 * Usage:
 *   node scripts/init-selectors.js
 */

const fs = require('fs').promises;
const path = require('path');

// Default selectors
const defaultSelectors = {
  'Profile Name': [
    'h1.text-heading-xlarge.inline.t-24.v-align-middle.break-words',
    'h1.text-heading-xlarge',
    'h1.pv-text-details__title--main',
    'div.pv-text-details__left-panel h1'
  ],
  'Profile Headline': [
    'div.pv-text-details__left-panel div.text-body-medium',
    'div.ph5 div.text-body-medium',
    'div.pv-text-details__title div.text-body-medium'
  ],
  'Profile Location': [
    'div.pv-text-details__left-panel span.text-body-small.inline.t-black--light.break-words',
    'div.ph5 span.text-body-small.inline.t-black--light.break-words',
    'span.text-body-small.inline.t-black--light'
  ],
  'About Section': [
    'section.pv-about-section div.pv-shared-text-with-see-more div.inline-show-more-text',
    'section#about div.pv-shared-text-with-see-more div.inline-show-more-text',
    'section.artdeco-card.pv-about-section div.display-flex.ph5.pv3'
  ],
  'Experience Section': [
    'section#experience',
    'section[data-section="experience"]',
    'section.artdeco-card.pv-profile-section.experience-section'
  ],
  'Education Section': [
    'section#education',
    'section[data-section="education"]',
    'section.artdeco-card.pv-profile-section.education-section'
  ],
  'Skills Section': [
    'section#skills',
    'section[data-section="skills"]',
    'section.artdeco-card.pv-profile-section.skills-section'
  ],
  'Volunteering Section': [
    'section#volunteering',
    'section[data-section="volunteering"]',
    'section.artdeco-card.pv-profile-section.volunteering-section'
  ],
  'Certifications Section': [
    'section#certifications',
    'section[data-section="certifications"]',
    'section.artdeco-card.pv-profile-section.certifications-section'
  ],
  'Profile Picture': [
    'img.pv-top-card-profile-picture__image',
    'img.profile-photo-edit__preview',
    'div.pv-top-card--photo img'
  ],
  'Company Name': [
    'span.pv-entity__secondary-title',
    'h4.pv-entity__secondary-title',
    'div.inline-show-more-text span[aria-hidden="true"]'
  ],
  'Job Title': [
    'div.pv-entity__summary-info h3',
    'div.pv-entity__summary-info-v2 h3',
    'span.pv-entity__job-title'
  ],
  'School Name': [
    'h3.pv-entity__school-name',
    'div.pv-entity__degree-info a',
    'span.pv-entity__school-name'
  ]
};

// Directory paths
const configDir = path.join(__dirname, '../config');
const selectorFilePath = path.join(configDir, 'linkedin-selectors.json');

async function initSelectors() {
  console.log('Initializing LinkedIn selector system...');

  try {
    // Create config directory if it doesn't exist
    try {
      await fs.mkdir(configDir, { recursive: true });
      console.log(`Created config directory: ${configDir}`);
    } catch (err) {
      if (err.code !== 'EEXIST') {
        throw err;
      }
    }

    // Check if selector file already exists
    try {
      await fs.access(selectorFilePath);
      console.log(`Selector file already exists: ${selectorFilePath}`);
      console.log('To regenerate, delete the file and run this script again.');

      // Read existing file to check its content
      const existingContent = await fs.readFile(selectorFilePath, 'utf8');
      const existingSelectors = JSON.parse(existingContent);
      const existingCategories = Object.keys(existingSelectors);

      console.log('\nCurrent selector categories:');
      existingCategories.forEach(category => {
        const count = existingSelectors[category].length;
        console.log(`- ${category} (${count} selectors)`);
      });

      // Compare with default selectors
      const defaultCategories = Object.keys(defaultSelectors);
      const missingCategories = defaultCategories.filter(cat => !existingCategories.includes(cat));

      if (missingCategories.length > 0) {
        console.log('\nMissing categories in current config:');
        missingCategories.forEach(category => {
          console.log(`- ${category}`);
        });

        // Ask if user wants to update
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });

        readline.question('\nWould you like to update with missing categories? (y/n): ', async (answer) => {
          if (answer.toLowerCase() === 'y') {
            // Add missing categories
            missingCategories.forEach(category => {
              existingSelectors[category] = defaultSelectors[category];
            });

            // Write updated file
            await fs.writeFile(selectorFilePath, JSON.stringify(existingSelectors, null, 2), 'utf8');
            console.log(`Updated ${selectorFilePath} with missing categories`);
          }

          readline.close();
        });
      }

      return;
    } catch (err) {
      // File doesn't exist, continue with creation
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }

    // Create selector file with default selectors
    await fs.writeFile(selectorFilePath, JSON.stringify(defaultSelectors, null, 2), 'utf8');
    console.log(`Created selector file: ${selectorFilePath}`);

    // Success message
    console.log('\nSelector system initialized successfully!');
    console.log('\nNext steps:');
    console.log('1. Update your code to use the central selector system');
    console.log('2. Verify selectors with a LinkedIn profile:');
    console.log('   npm run test:selectors:verify -- --url https://www.linkedin.com/in/username --account accountId');
    console.log('3. Update selectors if needed:');
    console.log('   npm run test:selectors:update -- --input path/to/metrics.json');

  } catch (error) {
    console.error('Error initializing selectors:', error);
    process.exit(1);
  }
}

// Run the script
initSelectors();

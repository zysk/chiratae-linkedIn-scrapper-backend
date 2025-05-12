/**
 * LinkedIn XPath Selectors
 *
 * This file contains all XPath selectors used for LinkedIn profile scraping.
 * Selectors are organized by category and include detailed comments for maintainability.
 *
 * XPath is preferred for all selectors due to its stability across LinkedIn UI changes.
 * CSS selectors should only be used when absolutely necessary, with clear documentation.
 */

/**
 * Interface for LinkedIn selectors organized by category
 */
export interface LinkedInSelectors {
  [category: string]: SelectorConfig[];
}

/**
 * Interface for selector configuration including XPath, fallback, and metadata
 */
export interface SelectorConfig {
  /** The XPath expression for the selector (primary approach) */
  xpath: string;

  /** CSS selector fallback (only used when XPath fails and absolutely necessary) */
  css?: string;

  /** Description of what this selector targets */
  description: string;

  /** Priority of the selector (lower number = higher priority) */
  priority: number;
}

/**
 * All LinkedIn selectors organized by category
 */
export const LINKEDIN_SELECTORS: LinkedInSelectors = {
  // Profile name selectors - more text-based approach
  "Profile Name": [
    {
      xpath: "//main//h1",
      description: "Main profile heading (h1) element in the main content area",
      priority: 1
    },
    {
      xpath: "//div[.//a[contains(@href, '/in/')]]//h1",
      description: "Main heading within container with profile URL",
      priority: 2
    },
    {
      xpath: "//h1[contains(@class, 'inline')]",
      description: "Profile name with inline class - common pattern",
      priority: 3
    },
    {
      xpath: "//div[contains(@class, 'profile-topcard')]//h1",
      description: "Heading in profile top card",
      priority: 4
    },
    {
      xpath: "//h1",
      description: "Any h1 element (fallback)",
      priority: 5
    }
  ],

  // Headline selectors
  "Headline": [
    {
      xpath: "//div[contains(@class, 'text-body-medium')][1]",
      description: "Profile headline displayed as first medium text",
      priority: 1
    },
    {
      xpath: "//h2[contains(@class, 'mt1')]",
      description: "Profile headline displayed as h2 with mt1 class",
      priority: 2
    },
    {
      xpath: "//div[contains(@class, 'pv-text-details__left-panel')]/div",
      description: "Profile headline in left panel",
      priority: 3
    }
  ],

  // Location selectors
  "Location": [
    {
      xpath: "//div[contains(@class, 'pv-text-details__left-panel')]/span[contains(@class, 'text-body-small')]",
      description: "Location in left panel as small text",
      priority: 1
    },
    {
      xpath: "//span[contains(@class, 'text-body-small') and contains(@class, 'inline-block')]",
      description: "Location as small inline text",
      priority: 2
    },
    {
      xpath: "//div[contains(@class, 'pb2')]/span[contains(@class, 'text-body-small')]",
      description: "Location in section with pb2 padding",
      priority: 3
    }
  ],

  // About section selectors
  "About": [
    {
      xpath: "//div[contains(@class, 'display-flex')]/div[contains(@class, 'inline-show-more-text')]",
      description: "About section in display-flex container with show more text",
      priority: 1
    },
    {
      xpath: "//section[contains(@class, 'pv-about-section')]/div",
      description: "About section in dedicated section",
      priority: 2
    },
    {
      xpath: "//section[@id='about']/div/div/div/span",
      description: "About section with ID",
      priority: 3
    }
  ],

  // Experience section selectors - text-based approach
  "Experience Section": [
    {
      xpath: "//section[.//h2[text()='Experience' or contains(text(), 'Experience')]]",
      description: "Section with Experience heading text",
      priority: 1
    },
    {
      xpath: "//div[.//h2[text()='Experience' or contains(text(), 'Experience')]]",
      description: "Div with Experience heading text",
      priority: 2
    },
    {
      xpath: "//section[.//*[text()='Experience' or contains(text(), 'Experience')]]",
      description: "Section with any element containing Experience text",
      priority: 3
    }
  ],

  // Experience item selectors
  "Experience Items": [
    {
      xpath: "//section[@id='experience-section']//li[contains(@class, 'pv-entity__position-group-pager')]",
      description: "Experience items in dedicated section",
      priority: 1
    },
    {
      xpath: "//section[.//h2[contains(text(), 'Experience')]]//li[contains(@class, 'pvs-list__item')]",
      description: "Experience items in general section with Experience heading",
      priority: 2
    },
    {
      xpath: "//div[@id='experience']//li[contains(@class, 'artdeco-list__item')]",
      description: "Experience items in div with experience ID",
      priority: 3
    }
  ],

  // Experience title selectors - text-based approach
  "Experience Title": [
    {
      xpath: "//section[.//h2[contains(text(), 'Experience')]]//li//h3",
      description: "Job title heading within experience list item",
      priority: 1
    },
    {
      xpath: "//section[.//h2[contains(text(), 'Experience')]]//li//span[contains(@class, 'bold') or contains(@class, 't-bold')]",
      description: "Bold text within experience list item (often job title)",
      priority: 2
    },
    {
      xpath: "//div[.//h2[contains(text(), 'Experience')]]//li//*[self::h3 or self::span[contains(@class, 'bold')]]",
      description: "Any bold element or h3 within experience list items",
      priority: 3
    }
  ],

  // Experience company selectors - text-based approach
  "Experience Company": [
    {
      xpath: "//section[.//h2[contains(text(), 'Experience')]]//li//*[contains(@aria-label, 'company') or contains(@aria-label, 'Company')]",
      description: "Element with company in aria-label within experience items",
      priority: 1
    },
    {
      xpath: "//section[.//h2[contains(text(), 'Experience')]]//li//p[1]",
      description: "First paragraph in experience list item (usually company name)",
      priority: 2
    },
    {
      xpath: "//section[.//h2[contains(text(), 'Experience')]]//li//a[contains(@href, '/company/')]",
      description: "Company link within experience list items",
      priority: 3
    }
  ],

  // Experience date range selectors
  "Experience Date Range": [
    {
      xpath: "//div[contains(@class, 'display-flex flex-column full-width')]//span[contains(@class, 't-14 t-normal t-black--light')]/span[@aria-hidden='true']",
      description: "Date range in flex column with light text",
      priority: 1
    },
    {
      xpath: "//div[contains(@class, 'pvs-entity__caption')]/span/span[@aria-hidden='true']",
      description: "Date range in entity caption",
      priority: 2
    },
    {
      xpath: "//div[contains(@class, 'pv-entity__date-range')]/span[not(contains(@class, 'visually-hidden'))]",
      description: "Date range excluding visually hidden elements",
      priority: 3
    }
  ],

  // Education section selectors - text-based approach
  "Education Section": [
    {
      xpath: "//section[.//h2[text()='Education' or contains(text(), 'Education')]]",
      description: "Section with Education heading text",
      priority: 1
    },
    {
      xpath: "//div[.//h2[text()='Education' or contains(text(), 'Education')]]",
      description: "Div with Education heading text",
      priority: 2
    },
    {
      xpath: "//section[.//*[text()='Education' or contains(text(), 'Education')]]",
      description: "Section with any element containing Education text",
      priority: 3
    }
  ],

  // Education items selectors
  "Education Items": [
    {
      xpath: "//section[@id='education-section']//li[contains(@class, 'pv-profile-section__list-item')]",
      description: "Education items in section with ID",
      priority: 1
    },
    {
      xpath: "//section[.//h2[contains(text(), 'Education')]]//li[contains(@class, 'pvs-list__item')]",
      description: "Education items in general section with Education heading",
      priority: 2
    },
    {
      xpath: "//div[@id='education']//li[contains(@class, 'artdeco-list__item')]",
      description: "Education items in div with education ID",
      priority: 3
    }
  ],

  // Skills section selectors - text-based approach
  "Skills Section": [
    {
      xpath: "//section[.//h2[text()='Skills' or contains(text(), 'Skills')]]",
      description: "Section with Skills heading text",
      priority: 1
    },
    {
      xpath: "//div[.//h2[text()='Skills' or contains(text(), 'Skills')]]",
      description: "Div with Skills heading text",
      priority: 2
    },
    {
      xpath: "//section[.//*[text()='Skills' or contains(text(), 'Skills')]]",
      description: "Section with any element containing Skills text",
      priority: 3
    }
  ],

  // Skills selectors
  "Skills": [
    {
      xpath: "//section[.//h2[contains(text(), 'Skills')]]//li",
      description: "List items within Skills section",
      priority: 1
    },
    {
      xpath: "//section[.//h2[contains(text(), 'Skills')]]//span[not(contains(@class, 'visually-hidden'))]",
      description: "Visible text spans within Skills section",
      priority: 2
    },
    {
      xpath: "//a[contains(@href, '/skills/')]",
      description: "Links to skill pages",
      priority: 3
    }
  ],

  // Profile picture selectors - text-based approach
  "Profile Picture": [
    {
      xpath: "//main//img[@alt[contains(., 'profile') or contains(., 'photo') or contains(., 'picture')]]",
      description: "Image with profile/photo/picture in alt text",
      priority: 1
    },
    {
      xpath: "//main//div[contains(@class, 'profile') or contains(@class, 'photo')]//img",
      description: "Image within container with profile/photo class",
      priority: 2
    },
    {
      xpath: "//img[contains(@alt, 'user')]",
      description: "Image with user in alt text",
      priority: 3
    }
  ],

  // Contact info section selectors
  "Contact Info": [
    {
      xpath: "//section[contains(@class, 'pv-contact-info')]",
      description: "Contact info section with class",
      priority: 1
    },
    {
      xpath: "//section[.//h2[contains(text(), 'Contact')]]",
      description: "Section with Contact heading",
      priority: 2
    },
    {
      xpath: "//a[contains(@href, 'overlay/contact-info/')]",
      description: "Contact info overlay link",
      priority: 3
    }
  ],

  // Email selectors in contact info
  "Contact Email": [
    {
      xpath: "//section[contains(@class, 'pv-contact-info')]//section[.//h3[contains(text(), 'Email')]]/div/a",
      description: "Email address in contact info section",
      priority: 1
    },
    {
      xpath: "//div[contains(@class, 'ci-email')]/div/a",
      description: "Email address with ci-email class",
      priority: 2
    },
    {
      xpath: "//section[contains(@class, 'ci-email')]//a",
      description: "Email address link in ci-email section",
      priority: 3
    }
  ],

  // Phone selectors in contact info
  "Contact Phone": [
    {
      xpath: "//section[contains(@class, 'pv-contact-info')]//section[.//h3[contains(text(), 'Phone')]]/div/span",
      description: "Phone number in contact info section",
      priority: 1
    },
    {
      xpath: "//div[contains(@class, 'ci-phone')]/div/span",
      description: "Phone number with ci-phone class",
      priority: 2
    },
    {
      xpath: "//section[contains(@class, 'ci-phone')]//span",
      description: "Phone number in ci-phone section",
      priority: 3
    }
  ],

  // Search result profile card selectors - updated for current LinkedIn UI
  "Search Result Cards": [
    {
      xpath: "//main//ul//li[.//a[contains(@href, '/in/')]]",
      description: "Any list item in main content that contains a profile link",
      priority: 1
    },
    {
      xpath: "//main//li[.//span[contains(@aria-hidden, 'true')]]",
      description: "List items with visible span text in main content",
      priority: 2
    },
    {
      xpath: "//div[contains(@class, 'search-results')]//li",
      description: "List items in search results container",
      priority: 3
    },
    {
      xpath: "//div[contains(@class, 'scaffold-layout__list')]//li",
      description: "List items in scaffold layout list",
      priority: 4
    },
    {
      xpath: "//ul[contains(@class, 'reusable-search__entity-result-list')]//li",
      description: "List items in entity result list",
      priority: 5
    }
  ],

  // Search result profile details selectors - updated for current LinkedIn UI
  "Search Result Name": [
    {
      xpath: ".//a[contains(@href, '/in/')]//span[not(contains(@class, 'visually-hidden'))]",
      description: "Visible text within profile links",
      priority: 1
    },
    {
      xpath: ".//span[contains(@aria-hidden, 'true')]",
      description: "Text spans that are aria-hidden=true - LinkedIn often uses for visible text",
      priority: 2
    },
    {
      xpath: ".//a[contains(@href, '/in/')]",
      description: "Profile link element (extract text)",
      priority: 3
    }
  ],

  "Search Result Profile URL": [
    {
      xpath: ".//a[contains(@href, '/in/')]",
      description: "Any link with '/in/' in href - direct profile link",
      priority: 1
    },
    {
      xpath: ".//a[contains(@href, 'linkedin.com/in/')]",
      description: "Any link with full LinkedIn profile URL",
      priority: 2
    }
  ],

  "Search Result Headline": [
    {
      xpath: ".//div[1]/following-sibling::div[1]",
      description: "First sibling div below name container - typically the headline",
      priority: 1
    },
    {
      xpath: ".//a[contains(@href, '/in/')]/parent::*/following-sibling::div[1]",
      description: "Div following the container of profile link - commonly headline",
      priority: 2
    },
    {
      xpath: ".//span[@aria-hidden='true']/ancestor::div[1]/following-sibling::div[1]//span[@aria-hidden='true']",
      description: "First visible text span in the div following name container",
      priority: 3
    }
  ],

  "Search Result Location": [
    {
      xpath: ".//div[1]/following-sibling::div[2]",
      description: "Second sibling div below name container - typically location",
      priority: 1
    },
    {
      xpath: ".//a[contains(@href, '/in/')]/parent::*/following-sibling::div[2]",
      description: "Second div following the container of profile link - commonly location",
      priority: 2
    },
    {
      xpath: ".//span[@aria-hidden='true']/ancestor::div[1]/following-sibling::div[2]//span[@aria-hidden='true']",
      description: "First visible text span in the second div following name container",
      priority: 3
    }
  ],

  "Search Pagination": [
    {
      xpath: "//button[@aria-label='Next']",
      description: "Next button in search pagination with aria-label",
      priority: 1
    },
    {
      xpath: "//button[contains(@class, 'artdeco-pagination__button--next')]",
      description: "Next button in search pagination with pagination class",
      priority: 2
    },
    {
      xpath: "//li[@class='artdeco-pagination__indicator artdeco-pagination__indicator--number']/following-sibling::li[1]/button",
      description: "Next button as next list item after page indicators",
      priority: 3
    }
  ],

  "Search Container": [
    {
      xpath: "//div[contains(@class, 'search-results-container')]",
      description: "Main search results container with class name",
      priority: 1
    },
    {
      xpath: "//div[contains(@class, 'scaffold-layout__list')]",
      description: "List container in scaffold layout",
      priority: 2
    },
    {
      xpath: "//main//div[.//ul[.//li[.//a[contains(@href, '/in/')]]]]",
      description: "Main container with list containing profile links",
      priority: 3
    },
    {
      xpath: "//div[@id='search-results-container']",
      description: "Search results container by ID",
      priority: 4
    }
  ],

  "Search Input": [
    {
      xpath: "//input[contains(@placeholder, 'Search')]",
      description: "Main search input field",
      priority: 1
    },
    {
      xpath: "//div[contains(@class, 'search-global-typeahead')]//input",
      description: "Global typeahead search input",
      priority: 2
    },
    {
      xpath: "//div[contains(@class, 'global-nav__search')]//input",
      description: "Global nav search input",
      priority: 3
    }
  ],

  "People Tab": [
    {
      xpath: "//a[contains(@href, 'search/results/people')]",
      description: "People tab in search results",
      priority: 1
    },
    {
      xpath: "//button[contains(@class, 'search-reusables__filter-pill-button') and contains(text(), 'People')]",
      description: "People filter pill button",
      priority: 2
    },
    {
      xpath: "//li[@aria-label='People']/button",
      description: "People tab button",
      priority: 3
    }
  ]
};

/**
 * Gets all selector configs for a specific category
 * @param category The category to get selectors for
 * @returns Array of selector configs for the category
 */
export function getSelectors(category: string): SelectorConfig[] {
  return LINKEDIN_SELECTORS[category] || [];
}

/**
 * Gets all XPath selectors for a specific category
 * @param category The category to get XPath selectors for
 * @returns Array of XPath strings
 */
export function getXPathSelectors(category: string): string[] {
  const selectors = getSelectors(category);
  return selectors
    .sort((a, b) => a.priority - b.priority)
    .map(selector => selector.xpath);
}

/**
 * Gets all CSS selectors for a specific category (fallbacks)
 * @param category The category to get CSS selectors for
 * @returns Array of CSS strings
 */
export function getCssSelectors(category: string): string[] {
  const selectors = getSelectors(category);
  return selectors
    .filter(selector => selector.css)
    .sort((a, b) => a.priority - b.priority)
    .map(selector => selector.css!)
    .filter(Boolean);
}

/**
 * Gets all categories with their selectors
 * @returns Complete LinkedInSelectors object
 */
export function getAllSelectors(): LinkedInSelectors {
  return LINKEDIN_SELECTORS;
}

/**
 * Gets the best (highest priority) XPath selector for a category
 * @param category The category to get the best selector for
 * @returns Best XPath selector or undefined if category not found
 */
export function getBestXPathSelector(category: string): string | undefined {
  const selectors = getSelectors(category);
  if (!selectors || selectors.length === 0) return undefined;

  const sortedSelectors = [...selectors].sort((a, b) => a.priority - b.priority);
  return sortedSelectors[0].xpath;
}

import { WebDriver } from 'selenium-webdriver';
import { IProxy } from '../interfaces/proxy.interface';
import { ILinkedInAccount } from '../models/linkedinAccount.model';

export interface LinkedInExperienceItem {
  title: string;
  company: string;
  location?: string;
  duration?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  companyUrl?: string;
  employmentType?: string;
  industry?: string;
  skills?: string[];
}

export interface LinkedInEducationItem {
  school: string;
  degree?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  schoolUrl?: string;
  grade?: string;
  activities?: string[];
}

export interface LinkedInPostItem {
  title?: string;
  content: string;
  date: string;
  url: string;
  reactions?: number;
  comments?: number;
  shares?: number;
  mediaUrls?: string[];
}

export interface LinkedInArticleItem {
  title: string;
  date: string;
  url: string;
  description?: string;
  publisher?: string;
  reactions?: number;
  comments?: number;
  shares?: number;
  thumbnailUrl?: string;
}

/**
 * LinkedIn Profile Data Interface
 * Contains the data extracted from a LinkedIn profile
 */
export interface LinkedInProfileData {
  name?: string;
  headline?: string;
  location?: string;
  about?: string;
  profilePictureUrl?: string;
  backgroundImageUrl?: string;
  experience?: LinkedInExperienceItem[];
  education?: LinkedInEducationItem[];
  certifications?: {
    name: string;
    issuingOrganization?: string;
    issueDate?: string;
    expirationDate?: string;
    credentialId?: string;
    credentialUrl?: string;
  }[];
  volunteering?: {
    role: string;
    organization: string;
    cause?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }[];
  awards?: {
    title: string;
    issuer?: string;
    issueDate?: string;
    description?: string;
  }[];
  publications?: {
    title: string;
    publisher?: string;
    date?: string;
    url?: string;
    description?: string;
    coAuthors?: string[];
  }[];
  recommendations?: {
    type: 'received' | 'given';
    text: string;
    author: {
      name: string;
      title?: string;
      relationship?: string;
    };
    date?: string;
    featured?: boolean;
  }[];
  interests?: {
    name: string;
    category?: string;
    followers?: number;
  }[];
  skills?: string[];
  languages?: {
    language: string;
    proficiency?: string;
  }[];
  posts?: LinkedInPostItem[];
  articles?: LinkedInArticleItem[];
  contactInfo?: {
    email?: string;
    phone?: string;
    websites?: string[];
    twitter?: string;
    birthday?: string;
    connectedOn?: string;
  };
  additionalInfo?: {
    [key: string]: string | string[] | undefined;
  };
  endorsements?: Endorsement[];
}

export interface IScrapeResult {
  success: boolean;
  data?: LinkedInProfileData;
  error?: string;
}

export interface WebDriverManager {
  getDriver(campaignId: string, options: {
    headless: boolean;
    proxy?: IProxy;
    linkedInAccount: ILinkedInAccount;
    password: string;
  }): Promise<WebDriver | null>;
  releaseDriver(campaignId: string): Promise<void>;
}

export interface Endorsement {
  skill: string;
  endorsers: number;
  endorserProfiles?: {
    name: string;
    headline?: string;
    profileUrl?: string;
  }[];
}

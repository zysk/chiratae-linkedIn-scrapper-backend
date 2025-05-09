/**
 * LinkedIn Profile Data Interface
 * Contains the data extracted from a LinkedIn profile
 */
export interface LinkedInProfileData {
  profileId: string;
  profileUrl: string;
  name: string;
  headline?: string;
  location?: string;
  summary?: string;
  imageUrl?: string;
  connections?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
    twitter?: string;
  };
}

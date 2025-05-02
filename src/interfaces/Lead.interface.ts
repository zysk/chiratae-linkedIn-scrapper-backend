import mongoose from "mongoose";
import { LeadStatus, Rating } from "../helpers/Constants";

export interface ILead {
  clientId: string; // LinkedIn profile ID/URL
  campaignId: mongoose.Types.ObjectId;
  leadAssignedToId?: mongoose.Types.ObjectId;
  status: LeadStatus;
  isSearched: boolean; // Flag for profile scraping status
  rating?: Rating;
  // Scraped Data (To be enriched here, NOT in User model)
  profileData?: {
    name?: string;
    title?: string;
    location?: string;
    profilePicture?: string;
    about?: string;
    experience?: Array<{
      company?: string;
      title?: string;
      duration?: string;
      description?: string;
    }>;
    education?: Array<{ school?: string; degree?: string; dates?: string }>;
    skills?: string[];
    contactInfo?: any; // Structure can vary
  };
  // Audit
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

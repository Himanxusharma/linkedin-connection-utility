export type OutreachStatus =
  | 'to_contact'
  | 'reviewed'
  | 'contacted'
  | 'applied'
  | 'connected';

export interface CompanyRecord {
  id: string;
  rank?: number;
  name: string;
  slug: string;
  category: string;
  subCategory?: string;
  linkedInUrl?: string;
  careersUrl?: string;
  website?: string;
  verified: boolean;
  source?: string;
  updatedAt?: string;
  outreachStatus?: OutreachStatus;
  notes?: string;
  isStarred?: boolean;
}

export type VerificationStatus = 'verified' | 'guess';

export interface WorkspaceRow {
  id: string;
  companyName: string;
  slug: string;
  status: VerificationStatus;
  category?: string;
  peopleLink: string;
  jobsLink: string;
  careersLink?: string;
  searchUrl: string;
  isCustomSlug?: boolean;
  outreachStatus?: OutreachStatus;
  notes?: string;
  isStarred?: boolean;
}

export interface TargetRoleOption {
  id: string;
  label: string;
  keyword: string;
}

export interface UserOutreachData {
  outreachMap?: Record<string, OutreachStatus>;
  notesMap?: Record<string, string>;
  starredSet?: string[];
  customCompanies?: CompanyRecord[];
  updatedAt?: string;
  userEmail?: string;
  userName?: string;
}


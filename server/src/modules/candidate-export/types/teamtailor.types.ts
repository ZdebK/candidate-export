// JSON API Specification types for Teamtailor API responses

export interface JsonApiLinks {
  next?: string | null;
  prev?: string | null;
  first?: string | null;
  last?: string | null;
}

export interface JsonApiMeta {
  'record-count': number;
  'page-count': number;
}

export interface JsonApiAttributes {
  [key: string]: unknown;
}

export interface JsonApiRelationshipData {
  type: string;
  id: string;
}

export interface JsonApiRelationship {
  data?: JsonApiRelationshipData | JsonApiRelationshipData[];
  links?: {
    related?: string;
    self?: string;
  };
}

export interface JsonApiResource<T extends JsonApiAttributes = JsonApiAttributes> {
  id: string;
  type: string;
  attributes: T;
  relationships?: Record<string, JsonApiRelationship>;
}

export interface JsonApiResponse<T extends JsonApiAttributes = JsonApiAttributes> {
  data: JsonApiResource<T>[];
  links: JsonApiLinks;
  meta: JsonApiMeta;
  included?: JsonApiResource[];
}

// Teamtailor Candidate attributes
export interface CandidateAttributes extends JsonApiAttributes {
  'first-name': string;
  'last-name': string;
  email: string;
  phone?: string;
  'created-at': string;
  'updated-at': string;
}

// Teamtailor Job Application attributes
export interface JobApplicationAttributes extends JsonApiAttributes {
  'created-at': string;
  'updated-at': string;
  stage?: string;
  status?: string;
}

export type CandidateResource = JsonApiResource<CandidateAttributes>;
export type JobApplicationResource = JsonApiResource<JobApplicationAttributes>;

export type CandidatesResponse = JsonApiResponse<CandidateAttributes>;
export type JobApplicationsResponse = JsonApiResponse<JobApplicationAttributes>;

// Flat structures after joining data
export interface CandidateRow {
  candidate_id: string;
  first_name: string;
  last_name: string;
  email: string;
  job_application_id: string;
  job_application_created_at: string;
}

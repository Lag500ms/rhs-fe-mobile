export interface OcrResult {
  id?: string;
  name?: string;
  dob?: string;
  sex?: string;
  nationality?: string;
  home?: string;
  address?: string;
  doe?: string;
  issueDate?: string;
  issueLoc?: string;
  type?: string;
  overallScore?: number;
}

export interface FaceMatchResult {
  isMatch: boolean;
  similarity: number;
  isBothImgIdCard: boolean;
  fptMessage: string;
}

export interface LivenessResult {
  isLive: boolean;
  spoofProbability: number;
  needToReview: boolean;
  isDeepfake: boolean;
  warning: string;
  livenessCode: string;
  livenessMessage: string;
  fptMessage: string;
}

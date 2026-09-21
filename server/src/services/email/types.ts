export enum EmailTemplate {
  WELCOME = 'WELCOME',
  CAFE_SUBMISSION_APPROVED = 'CAFE_SUBMISSION_APPROVED',
  CAFE_SUBMISSION_REJECTED = 'CAFE_SUBMISSION_REJECTED',
  OWNER_CLAIM_APPROVED = 'OWNER_CLAIM_APPROVED',
  OWNER_CLAIM_REJECTED = 'OWNER_CLAIM_REJECTED',
  REVIEW_APPROVED = 'REVIEW_APPROVED',
  REVIEW_REJECTED = 'REVIEW_REJECTED',
  REVIEW_HIDDEN = 'REVIEW_HIDDEN',
  REVIEW_RESTORED = 'REVIEW_RESTORED',
  CHANGE_REQUEST_APPROVED = 'CHANGE_REQUEST_APPROVED',
  CHANGE_REQUEST_REJECTED = 'CHANGE_REQUEST_REJECTED',
  CAFE_PUBLISHED = 'CAFE_PUBLISHED',
  CAFE_SUSPENDED = 'CAFE_SUSPENDED',
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  from?: {
    name: string;
    address: string;
  };
}

export interface EmailSendResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}

export interface EmailPayloads {
  [EmailTemplate.WELCOME]: {
    name: string;
    exploreUrl: string;
  };
  [EmailTemplate.CAFE_SUBMISSION_APPROVED]: {
    name: string;
    cafeName: string;
    cafeUrl: string;
  };
  [EmailTemplate.CAFE_SUBMISSION_REJECTED]: {
    name: string;
    cafeName: string;
    reason: string;
    submissionUrl?: string;
  };
  [EmailTemplate.OWNER_CLAIM_APPROVED]: {
    name: string;
    cafeName: string;
    dashboardUrl: string;
  };
  [EmailTemplate.OWNER_CLAIM_REJECTED]: {
    name: string;
    cafeName: string;
    reason: string;
    claimUrl?: string;
  };
  [EmailTemplate.REVIEW_APPROVED]: {
    name: string;
    cafeName: string;
    cafeUrl: string;
  };
  [EmailTemplate.REVIEW_REJECTED]: {
    name: string;
    cafeName: string;
    reason?: string;
  };
  [EmailTemplate.REVIEW_HIDDEN]: {
    name: string;
    cafeName: string;
  };
  [EmailTemplate.REVIEW_RESTORED]: {
    name: string;
    cafeName: string;
    cafeUrl: string;
  };
  [EmailTemplate.CHANGE_REQUEST_APPROVED]: {
    name: string;
    cafeName: string;
    changeType: string;
    dashboardUrl: string;
  };
  [EmailTemplate.CHANGE_REQUEST_REJECTED]: {
    name: string;
    cafeName: string;
    changeType: string;
    reason?: string;
    dashboardUrl: string;
  };
  [EmailTemplate.CAFE_PUBLISHED]: {
    name: string;
    cafeName: string;
    cafeUrl: string;
  };
  [EmailTemplate.CAFE_SUSPENDED]: {
    name: string;
    cafeName: string;
    reason?: string;
  };
}

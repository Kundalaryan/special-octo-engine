export type FeedbackStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED';

export interface Suggestion {
  id: number;
  userPhone: string;
  message: string;
  status: FeedbackStatus;
  createdDate: string; // "2026-01-19"
  createdAt: string;   // ISO timestamp
}

export interface FeedbackResponse {
  success: boolean;
  message: string;
  data: {
    content: Suggestion[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number; // Current page index (0-based)
    first: boolean;
    last: boolean;
    empty: boolean;
  };
}
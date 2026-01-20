export type IssueSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type IssueStatus = 'OPEN' | 'RESOLVED' | 'REJECTED' | 'IN_PROGRESS';
export type IssueType = 'NOT_RECEIVED' | 'DAMAGED_ITEM' | 'WRONG_ITEM' | 'REFUND_REQUEST' | 'OTHER';

export interface Issue {
  id: number;
  orderId: number;
  customerPhone: string;
  issueType: IssueType | string; // Allow string in case backend adds new types
  severity: IssueSeverity;
  status: IssueStatus;
  description: string;
  createdAt: string;
  resolvedAt: string | null;
  acknowledgedAt: string | null;
  resolvedBy: string | null;
  adminNote: string | null;
}

export interface IssuesResponse {
  success: boolean;
  message: string;
  data: {
    content: Issue[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
    empty: boolean;
  };
}
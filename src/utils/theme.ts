// Theme Constants

export const SEVERITY_COLORS = {
    CRITICAL: 'bg-red-100 text-red-700 border-red-200',
    HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
    MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
    LOW: 'bg-slate-100 text-slate-700 border-slate-200',
    DEFAULT: 'bg-gray-100 text-gray-700'
} as const;

export const STATUS_COLORS = {
    OPEN: 'text-amber-600 bg-amber-50 border-amber-100',
    IN_PROGRESS: 'text-blue-600 bg-blue-50 border-blue-100',
    RESOLVED: 'text-green-600 bg-green-50 border-green-100',
    REJECTED: 'text-gray-600 bg-gray-50 border-gray-100',
    DEFAULT: 'text-gray-600'
} as const;

export type Severity = keyof typeof SEVERITY_COLORS;
export type Status = keyof typeof STATUS_COLORS;

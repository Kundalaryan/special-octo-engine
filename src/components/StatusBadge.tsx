interface StatusBadgeProps {
  children: React.ReactNode; // The text content (e.g., status label)
  className?: string; // The color classes (e.g., "bg-red-100 text-red-700")
}

export const StatusBadge = ({ children, className = 'bg-gray-100 text-gray-700 border-gray-200' }: StatusBadgeProps) => {
  return (
    <span className={`px-2.5 py-0.5 rounded border text-[10px] md:text-xs font-bold uppercase tracking-wide whitespace-nowrap ${className}`}>
      {children}
    </span>
  );
};

// Helper utility to format enum strings (ORDER_PLACED -> Order Placed)
export const formatEnum = (str: string) => {
  if (!str) return '';
  return str.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};
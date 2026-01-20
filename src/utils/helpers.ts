// Helper utility to format enum strings (ORDER_PLACED -> Order Placed)
export const formatEnum = (str: string) => {
    if (!str) return '';
    return str.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};

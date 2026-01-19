// Response for /admin/dashboard/summary
export interface DashboardSummary {
  totalOrders: number;
  packedOrders: number;
  outForDelivery: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalCashCollected: number;
}

// Response for /admin/analytics/sales/7-days
export interface DailySalesData {
  date: string;
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalCashCollected: number;
}

// Response for /admin/analytics/sales/today-vs-yesterday
export interface SalesComparison {
  today: DailySalesData;
  yesterday: DailySalesData;
  change: {
    ordersPercent: number;
    revenuePercent: number;
    trend: 'UP' | 'DOWN' | 'FLAT';
  };
}

// Generic Wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
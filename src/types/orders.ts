export type OrderStatus = 'ORDER_PLACED' | 'PACKED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

export interface Order {
  id: number;
  customerName: string;
  phone: string; // Customer phone
  address: string;
  totalAmount: number;
  status: OrderStatus;
  customerPhone: string; // Sometimes duplicate in backend, we map what's there
  deliveryPhone: string;
  assignedAt: string;
  createdAt: string;
  receiptNumber: string;
  receiptGeneratedAt: string;
}

export interface OrdersApiResponse {
  success: boolean;
  message: string;
  data: {
    content: Order[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number; // Current page index (0-based)
    first: boolean;
    last: boolean;
    empty: boolean;
  };
}

export interface OrderFilters {
  status?: OrderStatus | '';
  phone?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  size: number;
}
export interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface OrderDetails {
  orderId: number;
  status: OrderStatus;
  createdAt: string;
  customerPhone: string;
  address: string;
  deliveryPhone: string;
  totalAmount: number;
  items: OrderItem[];
}

export interface TimelineEvent {
  id: number;
  orderId: number;
  status: OrderStatus;
  timestamp: string;
}

export interface OrderDetailsResponse {
  success: boolean;
  message: string;
  data: OrderDetails;
}

export interface TimelineResponse {
  success: boolean;
  message: string;
  data: TimelineEvent[];
}
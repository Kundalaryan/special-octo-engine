export interface Product {
  id: number;
  name: string;
  category: string;
  unit: string;
  price: number;
  stock: number;
  description: string;
  imageUrl: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryResponse {
  success: boolean;
  message: string;
  data: Product[];
}
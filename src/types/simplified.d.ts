// Tipos simplificados para StocklyApp v3

export interface Product {
  id: string;
  name: string;
  category: string;
  description?: string;
  currentStock: number;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateItem {
  id: string;
  productId: string;
  idealQuantity: number;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  updatedAt: string;
  // Campos adicionales para joins
  productName?: string;
  category?: string;
  currentStock?: number;
  expiryDate?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: 'add' | 'remove' | 'expired';
  quantity: number;
  reason?: string;
  createdAt: string;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

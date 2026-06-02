/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'Super Admin' | 'Admin' | 'Manager' | 'Cashier' | 'Waiter' | 'Kitchen Staff' | 'Bar Staff' | 'Customer';

export type OrderStatus = 'Pending' | 'Accepted' | 'Preparing' | 'Ready' | 'Served' | 'Paid' | 'Completed' | 'Cancelled';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  createdAt: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: 'Food' | 'Drink' | 'Fruit';
  price: number;
  description: string;
  imageUrl: string;
  image_url?: string;
  image_name?: string;
  isAvailable: boolean;
}

export interface RestaurantTable {
  id: number; // Table Number 1 to 100
  qrPath: string; // File path to static PNG
  status: 'Empty' | 'Ordering' | 'Occupied' | 'Billing';
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  category: 'Food' | 'Drink' | 'Fruit';
  price: number;
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  tableId: number;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  servedAt?: string;
  preparedAt?: string;
  acceptedAt?: string;
}

export interface Payment {
  id: string;
  orderId: string;
  tableId: number;
  amount: number;
  paymentMethod: 'Cash' | 'MPesa' | 'Airtel Money' | 'Card' | 'Mixx';
  status: 'Pending' | 'Completed';
  createdAt: string;
  transactionId?: string; // M-Pesa, Airtel Money, or Card serial format
  taxAmount?: number;      // 18% Local VAT
  costAmount?: number;     // Preparation cost (35% standard)
  netProfit?: number;      // Live Net Profit
}

export interface PrivacySettings {
  maskFinancialMetrics: boolean;
  maskCustomerData: boolean;
  maskPayments: boolean;
}

export interface Notification {
  id: string;
  message: string;
  type: 'OrderPlaced' | 'StatusUpdated' | 'CallWaiter' | 'BillRequested' | 'Emergency';
  role: UserRole;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  role: string;
  action: string;
  timestamp: string;
}

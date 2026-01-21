// User Types
export interface User {
  _id: string;
  username: string;
  name: string;
  role: 'ADMIN' | 'STAFF';
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt?: string;
}

// Member Types
export interface Member {
  _id: string;
  fullName: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  dateOfJoining: string;
  packageType: PackageType;
  packagePrice: number;
  packageStart: string;
  packageEnd: string;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;
  trainerId?: string;
  trainer?: Trainer;
  memberId: string;
  discountType: 'NONE' | 'FIXED' | 'CUSTOM';
  discountAmount: number;
  isActive: boolean;
  isVerified: boolean;
  verificationDate?: string;
  lastAction?: 'CREATE' | 'UPDATE';
  createdBy?: { _id: string; name: string; role: string };
  createdAt: string;
  updatedAt: string;
}

export type PackageType = 'A' | 'B' | 'C' | 'D' | 'E';

export type PaymentStatus = 'PAID' | 'DUE' | 'PARTIAL';

export interface Trainer {
  _id: string;
  name: string;
  phone: string;
  specialty?: string;
}

export interface Payment {
  _id: string;
  memberId: string;
  member?: Member;
  amount: number;
  date: string;
  method: 'CASH' | 'UPI' | 'CARD';
  notes?: string;
}

export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  expiringThisWeek: number;
  expiredMembers: number;
  totalCollected: number;
  totalPending: number;
  membersWithDues: number;
  recentAdmissions: Member[];
  unverifiedMembersCount?: number;
  newMembersThisMonth?: number;
  renewedMembersThisMonth?: number;
}

// Package prices (default values)
export const PACKAGE_PRICES: Record<PackageType, number> = {
  'A': 1999,
  'B': 4499,
  'C': 6999,
  'D': 10999,
  'E': 15999,
};

// Package duration in months
export const PACKAGE_MONTHS: Record<PackageType, number> = {
  'A': 1,
  'B': 3,
  'C': 6,
  'D': 12,
  'E': 24,
};

// Package duration in days (approximate for calculation if needed, but we'll use month logic)
export const PACKAGE_DURATIONS: Record<PackageType, number> = {
  'A': 30,
  'B': 90,
  'C': 180,
  'D': 365,
  'E': 730,
};

export const PACKAGE_LABELS: Record<PackageType, string> = {
  'A': '1 Month (A)',
  'B': '3 Months (B)',
  'C': '6 Months (C)',
  'D': '12 Months (D)',
  'E': '24 Months (E)',
};

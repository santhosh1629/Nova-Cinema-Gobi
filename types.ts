
export enum Role {
  STUDENT = 'STUDENT',
  CANTEEN_OWNER = 'CANTEEN_OWNER',
  ADMIN = 'ADMIN',
}

export type StaffRoleType = 'counter' | 'delivery' | 'qr_scanner' | 'manager';

export interface User {
  id: string;
  username: string;
  role: Role;
  phone?: string;
  password?: string;
  email?: string;
  profileImageUrl?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvalDate?: string;
  isFirstLogin?: boolean;
  resetOtp?: string;
  resetOtpExpires?: Date;
  canteenName?: string;
  idProofUrl?: string;
  loyaltyPoints?: number;
  staffRole?: StaffRoleType;
  isActiveProfile?: boolean;
}

export type DietaryTag = 'vegetarian' | 'vegan' | 'gluten-free';

export interface MenuItem {
  id:string;
  name: string;
  price: number;
  isAvailable: boolean;
  imageUrl: string;
  description?: string;
  emoji?: string;
  averageRating?: number;
  favoriteCount?: number;
  isFavorited?: boolean;
  dietaryTags?: DietaryTag[];
  nutrition?: {
    calories: number;
    protein: string;
    fat: string;
    carbs: string;
  };
  isCombo?: boolean;
  comboItems?: { id: string; name: string }[];
  isDemo?: boolean;
  category?: 'food' | 'game';
  slotIds?: string[];
  durationMinutes?: number;
}

export interface CartItem extends MenuItem {
  quantity: number;
  notes?: string;
  selectedSlotId?: string;
  selectedStartTime?: string;
}

export enum OrderStatus {
  PENDING = 'pending',
  PREPARED = 'prepared',
  PARTIALLY_COLLECTED = 'partially_collected',
  COLLECTED = 'collected',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export interface Order {
  id: string;
  studentId: string;
  studentName: string;
  customerPhone?: string;
  items: {
    id: string; // This corresponds to menu_item_id in DB
    name: string;
    quantity: number;
    price: number;
    notes?: string;
    imageUrl: string;
    category?: 'food' | 'game';
    selectedSlotId?: string;
    durationMinutes?: number;
    selectedStartTime?: string;
    isDelivered?: boolean;
    deliveredQuantity?: number;
  }[];
  totalAmount: number;
  status: OrderStatus;
  qrToken: string;
  timestamp: Date;
  orderType: 'real';
  canteenOwnerPhone?: string;
  refundAmount?: number;
  collectedByStaffId?: string;
  seatNumber?: string;
  couponCode?: string;
  discountAmount?: number;
  gameStartTime?: string;
  gameEndTime?: string;
  collectedAt?: string;
}

export interface SalesSummary {
    daily: { date: string; total: number }[];
    weekly: { week: string; total: number }[];
}

export interface Feedback {
    id: string;
    studentId: string;
    studentName: string;
    itemId: string;
    itemName: string;
    rating: number;
    comment?: string;
    timestamp: Date;
}

export interface Offer {
    id: string;
    code: string;
    description: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    isUsed: boolean;
    studentId: string;
    isReward?: boolean;
    isActive?: boolean;
    usageCount?: number;
    redeemedCount?: number;
}

export interface StudentProfile {
  id: string;
  name: string;
  phone: string;
  totalOrders: number;
  lifetimeSpend: number;
  favoriteItemsCount: number;
  loyaltyPoints?: number;
}

export interface Reward {
    id: string;
    title: string;
    description: string;
    pointsCost: number;
    discount: {
        type: 'fixed' | 'percentage';
        value: number;
    };
    isActive: boolean;
    expiryDate?: string;
}

export interface StudentPoints {
    studentId: string;
    studentName: string;
    points: number;
}

export interface TodaysDashboardStats {
  totalOrders: number;
  totalIncome: number;
  itemsSold: { name: string; quantity: number }[];
}

export interface TodaysDetailedReport {
  date: string;
  totalOrders: number;
  totalIncome: number;
  itemSales: {
    name: string;
    quantity: number;
    totalPrice: number;
  }[];
}

export interface OwnerBankDetails {
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    upiId?: string;
    email: string;
    phone: string;
}

export interface CanteenPhoto {
    id: string;
    data: string;
    uploadedAt: Date;
}

export interface AdminStats {
  totalUsers: number;
  totalCustomers: number;
  totalOwners: number;
  pendingApprovals: number;
  totalFeedbacks: number;
}

export interface CommissionRecord {
  id: string;
  month: string;
  totalIncome: number;
  commissionAmount: number;
  ownerId: string;
  ownerName: string;
}

/**
 * Interface representing the result of a slot availability check.
 */
export interface AvailabilityResult {
  isAvailable: boolean;
  conflict?: {
    start: string;
    end: string;
  };
}

export interface CombinedGroup {
  id: string;
  name: string;
  description?: string;
  serviceIds: string[];
  roomIds: string[];
  ownerId?: string;
  createdAt?: string;
}


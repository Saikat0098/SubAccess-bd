export interface IUser {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isEmailVerified: boolean;
  phone?: string;
  avatar?: string;
  address?: string;
  isBlocked?: boolean;
  createdAt?: string;
}

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isFeatured?: boolean;
}

export interface IProduct {
  _id: string;
  title: string;
  slug: string;
  category: ICategory | string;
  price: number;
  discountPrice?: number;
  duration: string;
  accessType: 'credentials' | 'invite_link' | 'license_key' | 'download_link';
  description: string;
  features: string[];
  stockQuantity: number;
  image: string;
  bannerColor?: string;
  deliveryTimeText: string;
  isActive: boolean;
  isPopular?: boolean;
  averageRating?: number;
  totalReviews?: number;
}

export interface IDeliveredCredential {
  label: string;
  value: string;
}

export interface IOrderItem {
  product: IProduct | string;
  title: string;
  image?: string;
  category?: string;
  price: number;
  discount?: number;
  quantity: number;
  duration: string;
  accessType: string;
  finalAmount?: number;
}

export interface IOrder {
  _id: string;
  orderNumber: string;
  user: IUser | string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: IOrderItem[];
  totalAmount: number;
  discountAmount: number;
  couponCode?: string;
  paymentMethod: 'bKash' | 'Nagad' | 'Rocket' | 'FastPay';
  transactionId: string;
  senderPhone: string;
  paymentScreenshot?: string;
  paymentStatus: 'pending' | 'verified' | 'rejected' | 'refunded';
  orderStatus: 'pending' | 'processing' | 'completed' | 'cancelled';
  deliveryStatus?: 'pending' | 'processing' | 'delivered' | 'cancelled';
  deliveredCredentials: IDeliveredCredential[];
  deliveryInstructions?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IPayment {
  _id: string;
  order: IOrder | string;
  user: IUser | string;
  paymentMethod: 'bKash' | 'Nagad' | 'Rocket' | 'FastPay';
  transactionId: string;
  senderPhone: string;
  amount: number;
  paymentScreenshot?: string;
  status: 'pending' | 'verified' | 'rejected' | 'refunded';
  rejectionReason?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IActivityLog {
  _id: string;
  user?: IUser | string;
  userName?: string;
  action: string;
  details?: string;
  createdAt: string;
}

export interface ICartItem {
  product: IProduct;
  quantity: number;
}

export interface ITicketMessage {
  _id?: string;
  sender: string;
  senderName: string;
  senderEmail?: string;
  senderRole: 'user' | 'admin';
  message?: string;
  text?: string;
  attachments?: string[];
  createdAt?: string;
  timestamp?: string;
  isRead?: boolean;
}

export interface ISupportTicket {
  _id: string;
  ticketId: string;
  user: IUser | string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  subject: string;
  category: string;
  orderNumber?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  attachments?: string[];
  status: 'open' | 'waiting_customer' | 'waiting_admin' | 'in_progress' | 'resolved' | 'closed' | 'reopened';
  assignedStaff?: string;
  internalNotes?: string;
  messages: ITicketMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface INotification {
  _id: string;
  title: string;
  message: string;
  type: 'order' | 'payment' | 'ticket' | 'system';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ICoupon {
  _id: string;
  code: string;
  discountType?: 'percent' | 'fixed';
  discountValue?: number;
  minOrderAmount?: number;
  discountPercentage?: number;
  maxDiscountBDT?: number;
  minSpendBDT?: number;
  expiresAt?: string;
  isActive?: boolean;
}

export interface IReview {
  _id: string;
  user?: IUser | string;
  userName: string;
  userAvatar?: string;
  product: IProduct | string;
  order?: IOrder | string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  isVerifiedPurchase?: boolean;
  isApproved?: boolean;
  isHidden?: boolean;
  isFeatured?: boolean;
  helpfulVotes?: number;
  helpfulUsers?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface ISettings {
  siteName: string;
  tagline: string;
  bkashNumber: string;
  nagadNumber: string;
  rocketNumber: string;
  helplineEmail: string;
  helplinePhone: string;
  whatsappNumber: string;
  noticeBannerText: string;
  noticeActive: boolean;
  maintenanceMode: boolean;
}

export interface IAnalytics {
  pendingOrdersCount: number;
  pendingPaymentsCount: number;
  todaysRevenueBDT: number;
  monthlyRevenueBDT: number;
  totalRevenueBDT: number;
  totalCustomersCount: number;
  totalProductsCount: number;
}

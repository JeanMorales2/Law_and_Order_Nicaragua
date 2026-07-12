export type UserRole = "Citizen" | "Lawyer" | "Student" | "Admin";
export type VerificationStatus = "Pending" | "Verified" | "Rejected";
export type PriceType = "Fixed" | "Range" | "Hourly";

export type AuthResponse = {
  accessToken: string;
  accessTokenExpiresAtUtc: string;
  refreshToken: string;
  refreshTokenExpiresAtUtc: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RefreshTokenRequest = {
  refreshToken: string;
};

export type RegisterLawyerProfileRequest = {
  barNumber: string;
  university: string;
  yearsExperience: number;
  bio: string;
  department: string;
  municipality: string;
};

export type RegisterRequest = {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: UserRole;
  lawyerProfile?: RegisterLawyerProfileRequest | null;
};

export type CurrentLawyerProfileResponse = {
  id: number;
  barNumber: string;
  university: string;
  isStudent: boolean;
  yearsExperience: number;
  bio: string;
  department: string;
  municipality: string;
  verificationStatus: VerificationStatus;
};

export type CurrentUserResponse = {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  lawyerProfile?: CurrentLawyerProfileResponse | null;
};

export type UpdateCurrentUserRequest = {
  fullName: string;
  phoneNumber: string;
};

export type RegisterDeviceTokenRequest = {
  deviceToken: string;
  platform: string;
};

export type CategoryResponse = {
  id: number;
  name: string;
  description: string;
  subcategories: CategoryResponse[];
};

export type SearchServiceSortBy = "rating" | "price" | "relevance";

export type SearchServicesRequest = {
  query?: string;
  categoryId?: number;
  sortBy?: SearchServiceSortBy;
  page?: number;
  pageSize?: number;
};

export type SearchServiceResponse = {
  serviceId: number;
  lawyerProfileId: number;
  lawyerName: string;
  lawyerPhotoUrl?: string | null;
  serviceName: string;
  price: number;
  estimatedDays: number;
  averageRating?: number | null;
  reviewCount: number;
  city: string;
  isVerified: boolean;
  isStudent: boolean;
};

export type PagedResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type PublicLawyerServiceResponse = {
  id: number;
  categoryId: number;
  categoryName: string;
  name: string;
  description: string;
  price: number;
  priceType: PriceType;
  estimatedDays: number;
  requiredDocuments: string;
};

export type OwnedServiceResponse = {
  id: number;
  categoryId: number;
  categoryName: string;
  name: string;
  description: string;
  price: number;
  priceType: PriceType;
  estimatedDays: number;
  requiredDocuments: string;
  isActive: boolean;
};

export type UpsertServiceRequest = {
  categoryId: number;
  name: string;
  description: string;
  price: number;
  priceType: PriceType;
  estimatedDays: number;
  requiredDocuments: string;
  isActive?: boolean;
};

export type PublicLawyerProfileResponse = {
  id: number;
  userId: number;
  fullName: string;
  university: string;
  isStudent: boolean;
  yearsExperience: number;
  bio: string;
  department: string;
  municipality: string;
  verificationStatus: VerificationStatus;
  isVerified: boolean;
  averageRating?: number | null;
  activeServices: PublicLawyerServiceResponse[];
};

export type LawyerReviewItemResponse = {
  id: number;
  serviceRequestId: number;
  clientId: number;
  clientName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type LawyerReviewsResponse = {
  items: LawyerReviewItemResponse[];
  page: number;
  pageSize: number;
  totalCount: number;
  averageRating?: number | null;
  totalPages: number;
};

export type CreateServiceRequestRequest = {
  serviceId: number;
  caseDetail: string;
};

export type ServiceRequestStatus = "Pending" | "InProgress" | "Completed" | "Rejected";
export type PlatformCommissionStatus = "Pending" | "Invoiced" | "Paid" | "Waived";
export type DayOfWeek =
  | "Sunday"
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";

export type ServiceRequestDetailResponse = {
  id: number;
  serviceId: number;
  serviceName: string;
  categoryName: string;
  clientId: number;
  clientName: string;
  lawyerProfileId: number;
  lawyerName: string;
  status: ServiceRequestStatus;
  caseDetail: string;
  agreedPrice?: number | null;
  createdAt: string;
  completedAt?: string | null;
  messageCount: number;
};

export type ServiceRequestSummaryResponse = {
  id: number;
  serviceId: number;
  serviceName: string;
  counterpartyName: string;
  status: ServiceRequestStatus;
  caseDetail: string;
  agreedPrice?: number | null;
  createdAt: string;
  completedAt?: string | null;
};

export type CreateReviewRequest = {
  rating: number;
  comment: string;
};

export type ReviewResponse = {
  id: number;
  serviceRequestId: number;
  lawyerProfileId: number;
  clientId: number;
  rating: number;
  comment: string;
  createdAt: string;
};

export type ChatMessageResponse = {
  id: number;
  serviceRequestId: number;
  senderId: number;
  senderName: string;
  content: string;
  attachmentUrl?: string | null;
  sentAt: string;
  isRead: boolean;
};

export type CompleteServiceRequestRequest = {
  agreedPrice: number;
};

export type AvailabilityDay = {
  dayOfWeek: DayOfWeek;
  isActive: boolean;
  startTime: string;
  endTime: string;
};

export type LawyerCommissionItemResponse = {
  id: number;
  serviceRequestId: number;
  serviceName: string;
  clientName: string;
  agreedPrice: number;
  commissionAmount: number;
  status: PlatformCommissionStatus;
  createdAt: string;
  settledAt?: string | null;
};

export type LawyerCommissionAccountResponse = {
  items: LawyerCommissionItemResponse[];
  totalGenerated: number;
  totalPending: number;
};

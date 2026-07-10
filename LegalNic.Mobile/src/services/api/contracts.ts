export type UserRole = "Citizen" | "Lawyer" | "Student" | "Admin";
export type VerificationStatus = "Pending" | "Verified" | "Rejected";

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
